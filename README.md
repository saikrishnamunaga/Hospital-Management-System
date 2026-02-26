🏥 Hospital Management System (HMS)

Hi! 👋
This project is a Hospital Management System backend built using Django and Django REST Framework (DRF). It is designed to manage hospital operations like handling patients, doctors, appointments, and administrative data through REST APIs.

This project can be used for learning purposes, academic submissions, or as a base for a full hospital management platform.

🚀 What This Project Does

The system helps manage:

🧑‍⚕️ Doctor information

🧑‍🤝‍🧑 Patient records

📅 Appointments scheduling

🏢 Hospital administrative data

🔐 Authentication & authorization

It exposes REST APIs that can be connected to a frontend (React, Angular, mobile app, etc.).

🛠 Tech Stack

Python

Django

Django REST Framework

SQLite / PostgreSQL

Docker (optional)

Ready for deployment (Render supported)

📦 Project Setup (Run Locally)

Follow these steps to run the project on your local machine.

1️⃣ Clone the repository
git clone https://github.com/saikrishnamunaga/Hospital-Management-System.git
cd Hospital-Management-System
2️⃣ Create a virtual environment
python -m venv venv

Activate it:

On Windows:

venv\Scripts\activate

On Mac/Linux:

source venv/bin/activate
3️⃣ Install dependencies
pip install -r requirements.txt
4️⃣ Apply migrations
python manage.py migrate
5️⃣ Run the server
python manage.py runserver

Now open your browser and go to:

http://127.0.0.1:8000/
🔐 Authentication

The project supports authentication (depending on your configuration).
You may use Django admin to create users:

python manage.py createsuperuser

Then access:

http://127.0.0.1:8000/admin/
🐳 Docker Support (If Included)

If Docker is configured:

docker-compose up --build
