from .base import *
import os

DEBUG = False

# Handle ALLOWED_HOSTS properly
hosts = os.environ.get('ALLOWED_HOSTS', 'hospital-management-system-rfkq.onrender.com')
if hosts:
    ALLOWED_HOSTS = [h.strip() for h in hosts.split(',') if h.strip()]
else:
    ALLOWED_HOSTS = []

SECURE_SSL_REDIRECT = os.environ.get('SECURE_SSL_REDIRECT', 'False') == 'True'
SESSION_COOKIE_SECURE = os.environ.get('SESSION_COOKIE_SECURE', 'False') == 'True'
CSRF_COOKIE_SECURE = os.environ.get('CSRF_COOKIE_SECURE', 'False') == 'True'
