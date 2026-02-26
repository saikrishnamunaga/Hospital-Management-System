from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from django.http import JsonResponse

def api_root(request):
    return JsonResponse({
        'message': 'Welcome to Hospital Management System',
        'api': '/api/',
        'admin': '/admin/',
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('core.urls')),
    path('', TemplateView.as_view(template_name='index.html'), name='home'),
    # Catch-all for React Router - must be last
    re_path(r'^.*$', TemplateView.as_view(template_name='index.html'), name='catch_all'),
]
