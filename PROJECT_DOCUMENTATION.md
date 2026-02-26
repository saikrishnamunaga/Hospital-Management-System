# Hospital Management System — Project Documentation

## 1. Project Overview

The Hospital Management System (HMS) is a scalable, production-ready backend application built with Django and Django REST Framework (DRF). It provides secure, role-based functionality for Admins, Doctors, and Patients including appointment booking, prescriptions, billing, analytics, and more. The system is designed for reliability, observability, and production deployment using containerization.

Goals:
- Provide a secure, audited platform for healthcare workflows.
- Be horizontally scalable and deployable via Render (or any container host).
- Offer a clean REST API for web and mobile clients.

## 2. Technology Stack
- Backend: Django, Django REST Framework
- Auth: JWT (djangorestframework-simplejwt)
- Database: PostgreSQL
- Cache / Broker: Redis
- WSGI: Gunicorn
- Static files: Whitenoise
- Containerization: Docker
- Deployment: Render (primary), can also target AWS/GCP/DigitalOcean
- Optional: Celery + Redis for async tasks
- Observability: Sentry (errors) + Prometheus/Grafana (metrics)

## 3. Core Features
- JWT Authentication with access & refresh tokens
- Role-based access control: `Admin`, `Doctor`, `Patient`
- Doctor & Patient profiles (User OneToOne)
- Appointment booking, rescheduling, cancellations
- Prescription management tied to appointments
- Billing, invoice generation and payment status tracking
- Dashboard analytics (revenue, appointments, active patients)
- Redis caching for frequently-read, costly queries
- Production-ready deployment configuration (Docker, Gunicorn, Whitenoise)

## 4. Database Design
Primary models (high-level):

- `User` (Custom User model)
  - id, email, password (hashed), first_name, last_name, role, is_active, is_staff, created_at, updated_at

- `Doctor`
  - user (OneToOne -> User), specialty, qualifications, license_number, bio, availability (JSON/structured)

- `Patient`
  - user (OneToOne -> User), date_of_birth, gender, contact_details, medical_history (link/reference)

- `Appointment`
  - id, doctor (FK -> Doctor), patient (FK -> Patient), scheduled_time (UTC), status (booked/cancelled/completed/no-show), duration_minutes, reason, created_at, updated_at

- `Prescription`
  - id, appointment (OneToOne -> Appointment), prescribed_at, medications (JSON / FK to Medication model), notes, issued_by (Doctor)

- `Invoice`
  - id, appointment (OneToOne -> Appointment), amount_cents, currency, status (pending/paid/failed), issued_at, paid_at, payment_method

Relationships:
- Doctor 1:1 -> User
- Patient 1:1 -> User
- Appointment FK -> Doctor, Patient
- Prescription 1:1 -> Appointment
- Invoice 1:1 -> Appointment

Mermaid ER (render-capable clients):

```mermaid
erDiagram
    USER ||--o{ DOCTOR : has
    USER ||--o{ PATIENT : has
    DOCTOR ||--o{ APPOINTMENT : "schedules"
    PATIENT ||--o{ APPOINTMENT : "books"
    APPOINTMENT ||--|| PRESCRIPTION : "may_have"
    APPOINTMENT ||--|| INVOICE : "may_generate"
```

## 5. API Surface (example endpoints)
Authentication:
- POST `/api/auth/token/` — obtain JWT pair
- POST `/api/auth/token/refresh/` — refresh access token

Users & Profiles:
- GET `/api/users/me/` — current user profile
- POST `/api/users/` — create user (Admin or Patient sign-up flows)

Doctor & Patient Management:
- GET `/api/doctors/` — list doctors (public)
- GET `/api/doctors/{id}/` — doctor profile
- POST `/api/doctors/` — (Admin only) add doctor

Appointments:
- POST `/api/appointments/` — book appointment (Patient)
- GET `/api/appointments/?doctor={id}&date=YYYY-MM-DD` — list
- PATCH `/api/appointments/{id}/` — reschedule/cancel (owner or admin)

Prescriptions:
- GET `/api/prescriptions/{appointment_id}/` — (Doctor or Patient)
- POST `/api/prescriptions/` — create (Doctor)

Invoices & Billing:
- GET `/api/invoices/` — list invoices (Admin/Doctor/Patient scoped)
- POST `/api/invoices/` — generate invoice (system/Doctor)

Dashboards & Analytics:
- GET `/api/dashboard/summary/` — cached summary stats (Admin)

Permissions summary:
- Admin: full access
- Doctor: manage appointments assigned to them, write prescriptions
- Patient: create/edit their appointments, view prescriptions and invoices

## 6. Performance Optimization
- Redis for caching dashboard summaries and frequent queries (e.g., `top-doctors`, `upcoming-appointments`) with TTL and cache invalidation on write.
- Use `select_related()` / `prefetch_related()` in querysets to avoid N+1 queries.
- Use Django aggregation (Sum/Count) for revenue and counts rather than looping in Python.
- Database indexes on `Appointment.scheduled_time`, `Appointment.status`, and FK fields.
- Paginate large lists (cursor pagination for timeline queries).

Example: caching the dashboard summary

```py
from django.core.cache import cache
CACHE_KEY = f"dashboard:summary:{org_id}"
summary = cache.get(CACHE_KEY)
if not summary:
    summary = compute_summary()
    cache.set(CACHE_KEY, summary, timeout=300)
```

## 7. Security Features & Checklist
- Environment-based configuration (12-factor): never commit secrets.
- JWT auth with short-lived access tokens and refresh tokens.
- `DEBUG = False` in production.
- HTTPS enforced at proxy/load-balancer level; set `SECURE_*` Django settings.
- Secure DB connections (SSL mode) and limited DB user privileges.
- Rate limit endpoints that can be abused (auth, create appointment) via DRF throttling.
- Input validation and serializer-level validation.
- Audit logs for critical actions (user creation, appointment changes, invoice payment).
- Regular dependency updates and vulnerability scanning.

Security environment variables to provide in production:
- `SECRET_KEY`
- `DATABASE_URL` (recommended format)
- `REDIS_URL`
- `DJANGO_ALLOWED_HOSTS`
- `SENTRY_DSN` (optional)
- `EMAIL_*` (SMTP configuration)
- `AWS_S3_*` or storage creds if using external static/media storage

## 8. Deployment Process (Docker + Render examples)

Recommended production process:
1. Build and test locally.
2. Push to GitHub.
3. Render (or other) builds Docker image from repo and deploy; link managed Postgres and Redis.

Example `Dockerfile` (concise):

```dockerfile
FROM python:3.11-slim
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
WORKDIR /app
COPY pyproject.toml poetry.lock* /app/
RUN apt-get update && apt-get install -y build-essential libpq-dev && rm -rf /var/lib/apt/lists/*
RUN pip install --upgrade pip
RUN pip install poetry && poetry config virtualenvs.create false && poetry install --no-dev --no-interaction
COPY . /app
ENV DJANGO_SETTINGS_MODULE=project.settings.production
RUN python manage.py collectstatic --noinput
CMD ["gunicorn", "project.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3", "--log-level", "info"]
```

Example `docker-compose.yml` for local development:

```yaml
version: '3.8'
services:
  web:
    build: .
    command: gunicorn project.wsgi:application --bind 0.0.0.0:8000 --reload
    env_file: .env.dev
    ports:
      - "8000:8000"
    depends_on:
      - db
      - redis
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: hms
      POSTGRES_USER: hmsuser
      POSTGRES_PASSWORD: hms_pass
    volumes:
      - pgdata:/var/lib/postgresql/data
  redis:
    image: redis:7
    ports:
      - "6379:6379"
volumes:
  pgdata:
```

Render-specific notes:
- Create a Web Service using Docker or the Build & Deploy from repo.
- Attach a Managed PostgreSQL instance and a Redis instance from Addons.
- Set environment variables in Render's dashboard (see Security section).
- Build command: (if using Dockerfile, Render handles it). If using build from repo: `pip install -r requirements.txt && python manage.py collectstatic --noinput`
- Start command: `gunicorn project.wsgi:application --bind 0.0.0.0:8000 --workers 3`

Whitenoise integration:
- Add `whitenoise` to `MIDDLEWARE` and use `WhiteNoiseMiddleware` for static file serving.
- Useful for simple deployments; for very large static assets, prefer S3 + CDN.

## 9. Observability & Monitoring
- Error tracking: Sentry (integrate `sentry-sdk` with Django)
- Metrics: expose Prometheus metrics endpoint (django-prometheus) and visualize on Grafana
- Logs: structured JSON output for Gunicorn and Django; use centralized log management (Logflare, Datadog, ELK)
- Health checks: `/health/` endpoint that checks DB and Redis connectivity

## 10. Testing & CI
- Unit tests with `pytest-django` and coverage reporting.
- Integration tests for critical flows (booking -> prescription -> invoice).
- Example GitHub Actions job (skeleton):

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: hms
          POSTGRES_USER: hms
          POSTGRES_PASSWORD: hms
        ports: [5432]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v4
        with:
          python-version: 3.11
      - run: pip install poetry
      - run: poetry install
      - run: pytest --maxfail=1 --disable-warnings -q
```

## 11. Future Roadmap
- Load balancing (auto-scaling, ALB) for high-traffic scenarios.
- Database read replicas and partitioning for scale.
- Redis clustering and failover for high availability.
- Celery with Redis (or RabbitMQ) for email, report generation, invoice processing.
- CDN integration (CloudFront, Cloudflare) for static/media distribution.
- Add RBAC policies for finer-grained permissions and feature flags.

## 12. Quickstart (local dev)
Prereqs: Docker & Docker Compose or Python 3.11 + Postgres + Redis locally.

1. Copy example env: `cp .env.example .env.dev` and update values.
2. Start services: `docker-compose up --build`
3. Run migrations: `docker-compose exec web python manage.py migrate`
4. Create superuser: `docker-compose exec web python manage.py createsuperuser`
5. Open http://localhost:8000

## 13. Contributing & Code Quality
- Use black/isort/ruff for formatting and linting.
- Write serializer + view tests for new features.
- Follow semantic commit messages and open PRs for review.

## 14. Appendix — Example Environment Variables
- `SECRET_KEY` — Django secret
- `DATABASE_URL` — postgres://user:pass@host:port/dbname
- `REDIS_URL` — redis://host:port/0
- `DJANGO_ALLOWED_HOSTS` — comma-separated hostnames
- `SENTRY_DSN` — optional
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`

---

If you'd like, I can:
- Generate sample `Dockerfile`, `docker-compose.yml`, `.env.example`, and `gunicorn` config files in the repo.
- Add a GitHub Actions CI workflow and Sentry config.
- Create Postgres schema migrations or model stubs.

Tell me which of those to create next and I will add them to the plan and implement.
