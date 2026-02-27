import os
from .base import *

# Override DEBUG - use environment variable
DEBUG = os.environ.get('DEBUG', 'False') == 'True'

# CRITICAL: Use ALLOWED_HOSTS from environment
# base.py already reads ALLOWED_HOSTS, but we add .onrender.com for subdomains
# Also add wildcard for all onrender.com subdomains
hosts_env = os.environ.get('ALLOWED_HOSTS', '')
if hosts_env:
    ALLOWED_HOSTS = [h.strip() for h in hosts_env.split(',') if h.strip()]
else:
    ALLOWED_HOSTS = ['localhost', '127.0.0.1']

# Add .onrender.com to catch all subdomains
ALLOWED_HOSTS.append('.onrender.com')
ALLOWED_HOSTS = list(set(ALLOWED_HOSTS))  # Remove duplicates

# Handle CORS settings - use environment variable
cors_origins = os.environ.get('CORS_ALLOWED_ORIGINS', '')
if cors_origins:
    CORS_ALLOWED_ORIGINS = [o.strip() for o in cors_origins.split(',') if o.strip()]
else:
    CORS_ALLOWED_ORIGINS = []



# CSRF settings - accept all origins in debug mode
CSRF_TRUSTED_ORIGINS = [
    'https://*.onrender.com',
    'http://*.onrender.com',
]

# Security settings
SECURE_SSL_REDIRECT = os.environ.get('SECURE_SSL_REDIRECT', 'False') == 'True'
SESSION_COOKIE_SECURE = os.environ.get('SESSION_COOKIE_SECURE', 'False') == 'True'
CSRF_COOKIE_SECURE = os.environ.get('CSRF_COOKIE_SECURE', 'False') == 'True'
