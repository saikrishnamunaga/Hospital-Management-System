try:
    from .celery import app as celery_app
    __all__ = ('celery_app',)
except ImportError:
    # Celery is optional - used for async tasks
    __all__ = ()
