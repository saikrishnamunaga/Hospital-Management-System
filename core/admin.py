from django.contrib import admin
from .models import User, Doctor, Patient, Appointment, Prescription, Invoice
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    pass

admin.site.register(Doctor)
admin.site.register(Patient)
admin.site.register(Appointment)
admin.site.register(Prescription)
admin.site.register(Invoice)
