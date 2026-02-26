from .base import *
import os

DEBUG = os.environ.get('DEBUG', 'False') == 'True'

# CRITICAL: Use DJANGO_ALLOWED_HOSTS from render.yaml env var
# base.py already reads DJANGO_ALLOWED_HOSTS, but we add .onrender.com for subdomains
# render.yaml sets DJANGO_ALLOWED_HOSTS, so we need to read from that
# Also add wildcard for all onrender.com subdomains
hosts_env = os.environ.get('DJANGO_ALLOWED_HOSTS', '')
if hosts_env:
    ALLOWED_HOSTS = [h.strip() for h in hosts_env.split(',') if h.strip()]
else:
    ALLOWED_HOSTS = ['localhost', '127.0.0.1']

# Add .onrender.com to catch all subdomains
ALLOWED_HOSTS.append('.onrender.com')
ALLOWED_HOSTS = list(set(ALLOWED_HOSTS))  # Remove duplicates

# Handle CORS settings - support comma-separated string from render.yaml
cors_origins = os.environ.get('CORS_ALLOWED_ORIGINS', '')
if cors_origins:
    CORS_ALLOWED_ORIGINS = [o.strip() for o in cors_origins.split(',') if o.strip()]
else:
    CORS_ALLOWED_ORIGINS = []

# Also allow all for debugging
CORS_ALLOW_ALL_ORIGINS = True

# CSRF settings - accept all origins in debug mode
CSRF_TRUSTED_ORIGINS = [
    'https://*.onrender.com',
    'http://*.onrender.com',
    'https://hospital-management-system-rfkq.onrender.com',
]

SECURE_SSL_REDIRECT = os.environ.get('SECURE_SSL_REDIRECT', 'False') == 'True'
SESSION_COOKIE_SECURE = os.environ.get('SESSION_COOKIE_SECURE', 'False') == 'True'
CSRF_COOKIE_SECURE = os.environ.get('CSRF_COOKIE_SECURE', 'False') == 'True'

# Use local memory cache if Redis is not available
REDIS_URL = os.environ.get('REDIS_URL')
if REDIS_URL:
    CACHES = {
        'default': {
            'BACKEND': 'django_redis.cache.RedisCache',
            'LOCATION': REDIS_URL,
            'OPTIONS': {'CLIENT_CLASS': 'django_redis.client.DefaultClient'},
        }
    }
else:
    # Fallback to local memory cache
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'unique-snowflake',
        }
    }
