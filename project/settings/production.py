from .base import *
import os

DEBUG = os.environ.get('DEBUG', 'False') == 'True'

# Handle ALLOWED_HOSTS properly
hosts = os.environ.get('ALLOWED_HOSTS', os.environ.get('DJANGO_ALLOWED_HOSTS', ''))
if hosts:
    ALLOWED_HOSTS = [h.strip() for h in hosts.split(',') if h.strip()]
else:
    ALLOWED_HOSTS = []

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
