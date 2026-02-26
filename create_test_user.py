#!/usr/bin/env python
"""Create test users for the HMS application."""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project.settings.local_settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from core.models import User, Doctor, Patient, DoctorSpecialty

# Create Admin User
admin_username = 'admin'
admin_email = 'admin@hms.com'
admin_password = 'admin123'

if not User.objects.filter(username=admin_username).exists():
    admin_user = User.objects.create_superuser(
        username=admin_username,
        email=admin_email,
        password=admin_password,
        role='admin'
    )
    print(f"Admin user created: {admin_username} / {admin_password}")
else:
    print(f"Admin user already exists: {admin_username}")

# Create Doctor User
doctor_username = 'doctor'
doctor_email = 'doctor@hms.com'
doctor_password = 'doctor123'

if not User.objects.filter(username=doctor_username).exists():
    doctor_user = User.objects.create_user(
        username=doctor_username,
        email=doctor_email,
        password=doctor_password,
        role='doctor',
        first_name='John',
        last_name='Smith'
    )
    # Get or create a specialty
    specialty, _ = DoctorSpecialty.objects.get_or_create(
        name='General Physician',
        defaults={'description': 'Primary care doctor', 'icon': '🩺'}
    )
    Doctor.objects.create(
        user=doctor_user,
        specialty=specialty,
        qualifications='MD, MBBS',
        experience_years=10,
        consultation_fee=5000  # $50.00
    )
    print(f"Doctor user created: {doctor_username} / {doctor_password}")
else:
    print(f"Doctor user already exists: {doctor_username}")

# Create Patient User
patient_username = 'patient'
patient_email = 'patient@hms.com'
patient_password = 'patient123'

if not User.objects.filter(username=patient_username).exists():
    patient_user = User.objects.create_user(
        username=patient_username,
        email=patient_email,
        password=patient_password,
        role='patient',
        first_name='Jane',
        last_name='Doe'
    )
    Patient.objects.create(
        user=patient_user,
        date_of_birth='1990-01-15',
        gender='female',
        phone='+1 234 567 8901',
        address='123 Main Street, City, State 12345',
        blood_group='O+',
        emergency_contact='+1 987 654 3210'
    )
    print(f"Patient user created: {patient_username} / {patient_password}")
else:
    print(f"Patient user already exists: {patient_username}")

# Create additional test patients
patients_data = [
    {'username': 'patient2', 'first_name': 'Alice', 'last_name': 'Johnson', 'email': 'alice@test.com', 'dob': '1985-05-20', 'gender': 'female', 'blood': 'A+'},
    {'username': 'patient3', 'first_name': 'Bob', 'last_name': 'Williams', 'email': 'bob@test.com', 'dob': '1978-08-10', 'gender': 'male', 'blood': 'B+'},
]

for pdata in patients_data:
    if not User.objects.filter(username=pdata['username']).exists():
        puser = User.objects.create_user(
            username=pdata['username'],
            email=pdata['email'],
            password='patient123',
            role='patient',
            first_name=pdata['first_name'],
            last_name=pdata['last_name']
        )
        Patient.objects.create(
            user=puser,
            date_of_birth=pdata['dob'],
            gender=pdata['gender'],
            blood_group=pdata['blood'],
            phone='+1 555 000 0000',
            address='Test Address'
        )
        print(f"Patient user created: {pdata['username']} / patient123")

print("\n=== Login Credentials ===")
print(f"Admin: {admin_username} / {admin_password}")
print(f"Doctor: {doctor_username} / {doctor_password}")
print(f"Patient: {patient_username} / {patient_password}")
print("Additional patients: patient2 / patient123, patient3 / patient123")
