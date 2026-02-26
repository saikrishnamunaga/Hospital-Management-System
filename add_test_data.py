#!/usr/bin/env python
"""Add more test data for the HMS application."""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project.settings.local_settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from core.models import User, Doctor, Patient, Appointment, DoctorSpecialty, Medication, Prescription, PrescriptionItem
from django.utils import timezone
from datetime import timedelta

# Get or create specialties
specialties_dict = {}
specialty_names = [
    'General Physician', 'Cardiologist', 'Dermatologist', 'Neurologist',
    'Orthopedic', 'Pediatrician', 'Psychiatrist', 'Ophthalmologist',
    'ENT Specialist', 'Gynecologist', 'Urologist', 'Gastroenterologist',
    'Pulmonologist', 'Endocrinologist', 'Oncologist'
]

for name in specialty_names:
    spec, _ = DoctorSpecialty.objects.get_or_create(
        name=name,
        defaults={'description': f'{name} specialist', 'icon': '🏥'}
    )
    specialties_dict[name] = spec

# Create additional doctors
doctors_data = [
    {'username': 'dr_smith', 'first_name': 'John', 'last_name': 'Smith', 'specialty': 'General Physician', 'qualifications': 'MBBS, MD', 'experience': 15, 'fee': 500},
    {'username': 'dr_jones', 'first_name': 'Sarah', 'last_name': 'Jones', 'specialty': 'Cardiologist', 'qualifications': 'MBBS, DM Cardiology', 'experience': 20, 'fee': 1500},
    {'username': 'dr_wilson', 'first_name': 'Michael', 'last_name': 'Wilson', 'specialty': 'Dermatologist', 'qualifications': 'MBBS, MD Dermatology', 'experience': 12, 'fee': 800},
    {'username': 'dr_brown', 'first_name': 'Emily', 'last_name': 'Brown', 'specialty': 'Pediatrician', 'qualifications': 'MBBS, MD Pediatrics', 'experience': 10, 'fee': 700},
    {'username': 'dr_davis', 'first_name': 'Robert', 'last_name': 'Davis', 'specialty': 'Neurologist', 'qualifications': 'MBBS, DM Neurology', 'experience': 18, 'fee': 2000},
    {'username': 'dr_miller', 'first_name': 'Lisa', 'last_name': 'Miller', 'specialty': 'Orthopedic', 'qualifications': 'MBBS, MS Ortho', 'experience': 14, 'fee': 1200},
    {'username': 'dr_anderson', 'first_name': 'David', 'last_name': 'Anderson', 'specialty': 'Psychiatrist', 'qualifications': 'MBBS, MD Psychiatry', 'experience': 16, 'fee': 1000},
    {'username': 'dr_taylor', 'first_name': 'Jennifer', 'last_name': 'Taylor', 'specialty': 'Gynecologist', 'qualifications': 'MBBS, MS Gynecology', 'experience': 15, 'fee': 900},
    {'username': 'dr_thomas', 'first_name': 'Christopher', 'last_name': 'Thomas', 'specialty': 'ENT Specialist', 'qualifications': 'MBBS, MS ENT', 'experience': 11, 'fee': 600},
    {'username': 'dr_jackson', 'first_name': 'Maria', 'last_name': 'Jackson', 'specialty': 'Ophthalmologist', 'qualifications': 'MBBS, MS Ophthalmology', 'experience': 13, 'fee': 850},
]

created_doctors = []
for doc_data in doctors_data:
    if not User.objects.filter(username=doc_data['username']).exists():
        user = User.objects.create_user(
            username=doc_data['username'],
            email=f"{doc_data['username']}@hms.com",
            password='doctor123',
            role='doctor',
            first_name=doc_data['first_name'],
            last_name=doc_data['last_name']
        )
        doctor = Doctor.objects.create(
            user=user,
            specialty=specialties_dict[doc_data['specialty']],
            qualifications=doc_data['qualifications'],
            experience_years=doc_data['experience'],
            consultation_fee=doc_data['fee'] * 100,  # Convert to cents
            is_available=True
        )
        created_doctors.append(doctor)
        print(f"Created doctor: Dr. {doc_data['first_name']} {doc_data['last_name']} - {doc_data['specialty']}")
    else:
        print(f"Doctor already exists: {doc_data['username']}")

# Get all patients
patients = list(Patient.objects.all())
doctors = list(Doctor.objects.all())

if len(patients) > 0 and len(doctors) > 0:
    # Create appointments with prescriptions
    appointments_created = 0
    
    # Appointment 1: John Smith (patient) with Dr. Sarah Jones (Cardiologist)
    if not Appointment.objects.filter(patient=patients[0], doctor=doctors[1]).exists():
        apt1 = Appointment.objects.create(
            patient=patients[0],
            doctor=doctors[1],
            scheduled_time=timezone.now() + timedelta(days=1),
            status='completed',
            reason='Heart checkup'
        )
        # Create invoice for the appointment
        from core.models import Invoice
        Invoice.objects.create(
            appointment=apt1,
            amount_cents=doctors[1].consultation_fee,
            currency='INR',
            status='paid'
        )
        
        # Create prescription with medications
        rx1 = Prescription.objects.create(
            appointment=apt1,
            diagnosis='Mild hypertension',
            notes='Monitor blood pressure regularly'
        )
        PrescriptionItem.objects.create(
            prescription=rx1,
            medication=Medication.objects.get(name='Aspirin 75mg'),
            dosage='1 tablet once daily',
            duration='30 days',
            quantity=1,
            instructions='Take after food'
        )
        PrescriptionItem.objects.create(
            prescription=rx1,
            medication=Medication.objects.get(name='Metformin 500mg'),
            dosage='1 tablet twice daily',
            duration='30 days',
            quantity=2,
            instructions='Take with meals'
        )
        appointments_created += 1
        print(f"Created appointment with prescription for {patients[0].user.first_name}")
    
    # Appointment 2: Patient 2 with Dr. Brown (Pediatrician)
    if len(patients) > 1 and not Appointment.objects.filter(patient=patients[1], doctor=doctors[3]).exists():
        apt2 = Appointment.objects.create(
            patient=patients[1],
            doctor=doctors[3],
            scheduled_time=timezone.now() + timedelta(days=2),
            status='completed',
            reason='Annual checkup'
        )
        
        from core.models import Invoice
        Invoice.objects.create(
            appointment=apt2,
            amount_cents=doctors[3].consultation_fee,
            currency='INR',
            status='paid'
        )
        
        # Create prescription
        rx2 = Prescription.objects.create(
            appointment=apt2,
            diagnosis='General wellness',
            notes='Healthy individual'
        )
        PrescriptionItem.objects.create(
            prescription=rx2,
            medication=Medication.objects.get(name='Vitamin D3 1000IU'),
            dosage='1 tablet once daily',
            duration='60 days',
            quantity=1,
            instructions='Take in morning'
        )
        appointments_created += 1
        print(f"Created appointment with prescription for {patients[1].user.first_name}")
    
    # Appointment 3: Patient 3 with Dr. Wilson (Dermatologist)
    if len(patients) > 2 and not Appointment.objects.filter(patient=patients[2], doctor=doctors[2]).exists():
        apt3 = Appointment.objects.create(
            patient=patients[2],
            doctor=doctors[2],
            scheduled_time=timezone.now() + timedelta(days=3),
            status='booked',
            reason='Skin rash'
        )
        appointments_created += 1
        print(f"Created appointment for {patients[2].user.first_name}")
    
    # Appointment 4: Jane Doe (patient) with Dr. Smith (General Physician)
    patient_jane = Patient.objects.filter(user__first_name='Jane').first()
    if patient_jane and not Appointment.objects.filter(patient=patient_jane, doctor=doctors[0]).exists():
        apt4 = Appointment.objects.create(
            patient=patient_jane,
            doctor=doctors[0],
            scheduled_time=timezone.now() + timedelta(hours=5),
            status='booked',
            reason='Fever and cold'
        )
        appointments_created += 1
        print(f"Created appointment for Jane Doe")

    print(f"\n=== Summary ===")
    print(f"Total Doctors: {Doctor.objects.count()}")
    print(f"Total Patients: {Patient.objects.count()}")
    print(f"Total Appointments: {Appointment.objects.count()}")
    print(f"Total Prescriptions: {Prescription.objects.count()}")
    print(f"Appointments created this run: {appointments_created}")
else:
    print("No patients or doctors found to create appointments")
