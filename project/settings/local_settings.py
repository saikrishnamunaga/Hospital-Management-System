# Optional local overrides
try:
    from .development import *
except Exception:
    pass

# Use SQLite for local development
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Override DEBUG for local development
DEBUG = True
ALLOWED_HOSTS = ['*']
