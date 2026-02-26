from .base import *
import os

DEBUG = os.environ.get('DEBUG', 'False') == 'True'

# CRITICAL: Use ALLOWED_HOSTS from render.yaml env var (not DJANGO_ALLOWED_HOSTS)
# render.yaml sets ALLOWED_HOSTS, so we need to read from that
hosts_env = os.environ.get('ALLOWED_HOSTS', '')
if hosts_env:
    ALLOWED_HOSTS = [h.strip() for h in hosts_env.split(',') if h.strip()]
else:
    ALLOWED_HOSTS = ['localhost', '127.0.0.1']

# Handle CORS settings - support comma-separated string from render.yaml
cors_origins = os.environ.get('CORS_ALLOWED_ORIGINS', '')
if cors_origins:
    CORS_ALLOWED_ORIGINS = [o.strip() for o in cors_origins.split(',') if o.strip()]
else:
    CORS_ALLOWED_ORIGINS = ['http://localhost:3000', 'http://127.0.0.1:3000']

# Debug logging to check what's being set
import logging
logger = logging.getLogger(__name__)
logger.error(f"PRODUCTION SETTINGS: ALLOWED_HOSTS = {ALLOWED_HOSTS}")
logger.error(f"PRODUCTION SETTINGS: CORS_ALLOWED_ORIGINS = {CORS_ALLOWED_ORIGINS}")

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
