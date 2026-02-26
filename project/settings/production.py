from .base import *
import os

DEBUG = False

# Handle ALLOWED_HOSTS properly
hosts = os.environ.get('ALLOWED_HOSTS', 'hospital-management-system-rfqk.onrender.com')
if hosts:
    ALLOWED_HOSTS = [h.strip() for h in hosts.split(',') if h.strip()]
else:
    ALLOWED_HOSTS = []

# CORS settings - allow the frontend on the same domain
cors_origin = os.environ.get('CORS_ALLOWED_ORIGINS', 'https://hospital-management-system-rfqk.onrender.com')
CORS_ALLOWED_ORIGINS = [origin.strip() for origin in cors_origin.split(',') if origin.strip()]

SECURE_SSL_REDIRECT = os.environ.get('SECURE_SSL_REDIRECT', 'False') == 'True'
SESSION_COOKIE_SECURE = os.environ.get('SESSION_COOKIE_SECURE', 'False') == 'True'
CSRF_COOKIE_SECURE = os.environ.get('CSRF_COOKIE_SECURE', 'False') == 'True'
