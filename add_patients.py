#!/usr/bin/env python
"""Add 20+ patients to the HMS application."""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project.settings.local_settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from core.models import User, Patient
from datetime import date, timedelta
import random

# Patient data - 25 patients
patients_data = [
    {'first_name': 'Alice', 'last_name': 'Johnson', 'email': 'alice.johnson@email.com', 'dob': '1990-05-15', 'gender': 'female', 'phone': '555-0101', 'blood_group': 'A+'},
    {'first_name': 'Bob', 'last_name': 'Williams', 'email': 'bob.williams@email.com', 'dob': '1985-08-22', 'gender': 'male', 'phone': '555-0102', 'blood_group': 'O+'},
    {'first_name': 'Carol', 'last_name': 'Davis', 'email': 'carol.davis@email.com', 'dob': '1992-03-10', 'gender': 'female', 'phone': '555-0103', 'blood_group': 'B+'},
    {'first_name': 'David', 'last_name': 'Martinez', 'email': 'david.martinez@email.com', 'dob': '1978-11-30', 'gender': 'male', 'phone': '555-0104', 'blood_group': 'AB+'},
    {'first_name': 'Emma', 'last_name': 'Garcia', 'email': 'emma.garcia@email.com', 'dob': '1995-07-18', 'gender': 'female', 'phone': '555-0105', 'blood_group': 'A-'},
    {'first_name': 'Frank', 'last_name': 'Rodriguez', 'email': 'frank.rodriguez@email.com', 'dob': '1982-12-05', 'gender': 'male', 'phone': '555-0106', 'blood_group': 'O-'},
    {'first_name': 'Grace', 'last_name': 'Lee', 'email': 'grace.lee@email.com', 'dob': '1988-09-25', 'gender': 'female', 'phone': '555-0107', 'blood_group': 'B-'},
    {'first_name': 'Henry', 'last_name': 'Walker', 'email': 'henry.walker@email.com', 'dob': '1975-02-14', 'gender': 'male', 'phone': '555-0108', 'blood_group': 'AB-'},
    {'first_name': 'Ivy', 'last_name': 'Hall', 'email': 'ivy.hall@email.com', 'dob': '1998-06-20', 'gender': 'female', 'phone': '555-0109', 'blood_group': 'A+'},
    {'first_name': 'Jack', 'last_name': 'Allen', 'email': 'jack.allen@email.com', 'dob': '1991-10-08', 'gender': 'male', 'phone': '555-0110', 'blood_group': 'O+'},
    {'first_name': 'Karen', 'last_name': 'Young', 'email': 'karen.young@email.com', 'dob': '1987-04-12', 'gender': 'female', 'phone': '555-0111', 'blood_group': 'B+'},
    {'first_name': 'Leo', 'last_name': 'King', 'email': 'leo.king@email.com', 'dob': '1993-08-30', 'gender': 'male', 'phone': '555-0112', 'blood_group': 'AB+'},
    {'first_name': 'Mia', 'last_name': 'Wright', 'email': 'mia.wright@email.com', 'dob': '1996-01-17', 'gender': 'female', 'phone': '555-0113', 'blood_group': 'A-'},
    {'first_name': 'Noah', 'last_name': 'Lopez', 'email': 'noah.lopez@email.com', 'dob': '1984-05-22', 'gender': 'male', 'phone': '555-0114', 'blood_group': 'O-'},
    {'first_name': 'Olivia', 'last_name': 'Hill', 'email': 'olivia.hill@email.com', 'dob': '1999-09-03', 'gender': 'female', 'phone': '555-0115', 'blood_group': 'B-'},
    {'first_name': 'Paul', 'last_name': 'Scott', 'email': 'paul.scott@email.com', 'dob': '1980-11-28', 'gender': 'male', 'phone': '555-0116', 'blood_group': 'AB-'},
    {'first_name': 'Quinn', 'last_name': 'Green', 'email': 'quinn.green@email.com', 'dob': '1994-03-15', 'gender': 'female', 'phone': '555-0117', 'blood_group': 'A+'},
    {'first_name': 'Ryan', 'last_name': 'Adams', 'email': 'ryan.adams@email.com', 'dob': '1986-07-09', 'gender': 'male', 'phone': '555-0118', 'blood_group': 'O+'},
    {'first_name': 'Sophia', 'last_name': 'Nelson', 'email': 'sophia.nelson@email.com', 'dob': '1997-12-21', 'gender': 'female', 'phone': '555-0119', 'blood_group': 'B+'},
    {'first_name': 'Tom', 'last_name': 'Carter', 'email': 'tom.carter@email.com', 'dob': '1983-02-06', 'gender': 'male', 'phone': '555-0120', 'blood_group': 'AB+'},
    {'first_name': 'Uma', 'last_name': 'Mitchell', 'email': 'uma.mitchell@email.com', 'dob': '1991-06-14', 'gender': 'female', 'phone': '555-0121', 'blood_group': 'A-'},
    {'first_name': 'Victor', 'last_name': 'Perez', 'email': 'victor.perez@email.com', 'dob': '1989-10-19', 'gender': 'male', 'phone': '555-0122', 'blood_group': 'O-'},
    {'first_name': 'Wendy', 'last_name': 'Roberts', 'email': 'wendy.roberts@email.com', 'dob': '1995-04-27', 'gender': 'female', 'phone': '555-0123', 'blood_group': 'B-'},
    {'first_name': 'Xavier', 'last_name': 'Turner', 'email': 'xavier.turner@email.com', 'dob': '1981-08-11', 'gender': 'male', 'phone': '555-0124', 'blood_group': 'AB-'},
    {'first_name': 'Yara', 'last_name': 'Phillips', 'email': 'yara.phillips@email.com', 'dob': '1992-01-05', 'gender': 'female', 'phone': '555-0125', 'blood_group': 'A+'},
]

created_count = 0
existing_count = 0

for patient_data in patients_data:
    username = f"{patient_data['first_name'].lower()}.{patient_data['last_name'].lower()}"
    
    if User.objects.filter(username=username).exists():
        existing_count += 1
        print(f"Patient already exists: {patient_data['first_name']} {patient_data['last_name']}")
        continue
    
    # Create user
    user = User.objects.create_user(
        username=username,
        email=patient_data['email'],
        password='patient123',
        role='patient',
        first_name=patient_data['first_name'],
        last_name=patient_data['last_name']
    )
    
    # Create patient profile
    patient = Patient.objects.create(
        user=user,
        date_of_birth=date.fromisoformat(patient_data['dob']),
        gender=patient_data['gender'],
        phone=patient_data['phone'],
        blood_group=patient_data['blood_group'],
        address=f"{random.randint(1, 999)} Main Street, City",
        emergency_contact=f"555-{random.randint(1000, 9999)}",
        medical_history=[],
        allergies=['None'] if random.random() > 0.3 else ['Penicillin'],
        current_symptoms=[],
        lab_reports=[],
        emergency_warnings=[]
    )
    
    created_count += 1
    print(f"Created patient: {patient_data['first_name']} {patient_data['last_name']}")

print(f"\n=== Summary ===")
print(f"Patients created: {created_count}")
print(f"Patients already existed: {existing_count}")
print(f"Total patients in database: {Patient.objects.count()}")
