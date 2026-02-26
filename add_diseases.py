#!/usr/bin/env python
"""Add diseases/conditions to the HMS application."""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project.settings.local_settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from core.models import DoctorSpecialty, Disease

# Get specialties
specialties = {}
for spec in DoctorSpecialty.objects.all():
    specialties[spec.name] = spec

# Diseases/Conditions data
diseases_data = [
    # Common conditions by specialty
    {'name': 'Common Cold', 'specialty': 'General Physician', 'description': 'Viral infection of the upper respiratory tract', 'symptoms': 'Runny nose, sore throat, cough, sneezing', 'treatment': 'Rest, fluids, over-the-counter medications', 'severity': 'mild'},
    {'name': 'Flu (Influenza)', 'specialty': 'General Physician', 'description': 'Viral infection causing fever, body aches, fatigue', 'symptoms': 'Fever, chills, muscle aches, cough, fatigue', 'treatment': 'Rest, fluids, antiviral medications if severe', 'severity': 'moderate'},
    {'name': 'Fever', 'specialty': 'General Physician', 'description': 'Elevated body temperature', 'symptoms': 'High temperature, sweating, chills, headache', 'treatment': 'Antipyretics, fluids, rest', 'severity': 'mild'},
    {'name': 'Hypertension', 'specialty': 'Cardiologist', 'description': 'High blood pressure condition', 'symptoms': 'Often asymptomatic, headaches, shortness of breath', 'treatment': 'Lifestyle changes, medications', 'severity': 'moderate'},
    {'name': 'Heart Arrhythmia', 'specialty': 'Cardiologist', 'description': 'Irregular heartbeat', 'symptoms': 'Palpitations, dizziness, shortness of breath', 'treatment': 'Medications, lifestyle changes, procedures', 'severity': 'moderate'},
    {'name': 'Chest Pain', 'specialty': 'Cardiologist', 'description': 'Pain or discomfort in the chest area', 'symptoms': 'Pressure, squeezing, tightness in chest', 'treatment': 'Depends on cause - seek immediate medical attention', 'severity': 'severe'},
    {'name': 'Acne', 'specialty': 'Dermatologist', 'description': 'Skin condition with pimples', 'symptoms': 'Pimples, blackheads, whiteheads, oily skin', 'treatment': 'Topical medications, antibiotics, lifestyle changes', 'severity': 'mild'},
    {'name': 'Eczema', 'specialty': 'Dermatologist', 'description': 'Chronic skin inflammation', 'symptoms': 'Itchy, red, dry, scaly skin', 'treatment': 'Moisturizers, topical steroids, avoiding triggers', 'severity': 'mild'},
    {'name': 'Psoriasis', 'specialty': 'Dermatologist', 'description': 'Autoimmune skin condition', 'symptoms': 'Red, scaly patches on skin, itching', 'treatment': 'Topical treatments, phototherapy, systemic medications', 'severity': 'moderate'},
    {'name': 'Migraine', 'specialty': 'Neurologist', 'description': 'Severe recurring headache', 'symptoms': 'Throbbing pain, nausea, sensitivity to light/sound', 'treatment': 'Pain relievers, preventive medications', 'severity': 'moderate'},
    {'name': 'Epilepsy', 'specialty': 'Neurologist', 'description': 'Brain disorder causing seizures', 'symptoms': 'Seizures, loss of consciousness, confusion', 'treatment': 'Antiepileptic medications, lifestyle changes', 'severity': 'severe'},
    {'name': 'Arthritis', 'specialty': 'Orthopedic', 'description': 'Joint inflammation causing pain', 'symptoms': 'Joint pain, stiffness, swelling, reduced mobility', 'treatment': 'Medications, physical therapy, lifestyle changes', 'severity': 'moderate'},
    {'name': 'Fracture', 'specialty': 'Orthopedic', 'description': 'Broken bone', 'symptoms': 'Severe pain, swelling, inability to move affected area', 'treatment': 'Casting, surgery, physical therapy', 'severity': 'severe'},
    {'name': 'Back Pain', 'specialty': 'Orthopedic', 'description': 'Pain in the back region', 'symptoms': 'Dull or sharp pain, limited mobility', 'treatment': 'Rest, physical therapy, medications', 'severity': 'mild'},
    {'name': 'Chickenpox', 'specialty': 'Pediatrician', 'description': 'Viral infection common in children', 'symptoms': 'Itchy rash, blisters, fever, fatigue', 'treatment': 'Symptomatic treatment, calamine lotion, rest', 'severity': 'mild'},
    {'name': 'Measles', 'specialty': 'Pediatrician', 'description': 'Highly contagious viral infection', 'symptoms': 'Rash, high fever, cough, runny nose, red eyes', 'treatment': 'Rest, fluids, vitamin A supplementation', 'severity': 'moderate'},
    {'name': 'ADHD', 'specialty': 'Psychiatrist', 'description': 'Attention deficit hyperactivity disorder', 'symptoms': 'Inattention, hyperactivity, impulsivity', 'treatment': 'Behavioral therapy, medications', 'severity': 'moderate'},
    {'name': 'Depression', 'specialty': 'Psychiatrist', 'description': 'Mental health disorder with persistent sadness', 'symptoms': 'Persistent sadness, loss of interest, fatigue, changes in appetite', 'treatment': 'Therapy, medications, lifestyle changes', 'severity': 'moderate'},
    {'name': 'Anxiety Disorder', 'specialty': 'Psychiatrist', 'description': 'Mental health condition with excessive worry', 'symptoms': 'Worry, restlessness, physical symptoms like rapid heartbeat', 'treatment': 'Therapy, medications, relaxation techniques', 'severity': 'moderate'},
    {'name': 'Conjunctivitis', 'specialty': 'Ophthalmologist', 'description': 'Eye inflammation (pink eye)', 'symptoms': 'Redness, itching, discharge, tearing', 'treatment': 'Eye drops, warm compresses, hygiene', 'severity': 'mild'},
    {'name': 'Cataracts', 'specialty': 'Ophthalmologist', 'description': 'Clouding of the eye lens', 'symptoms': 'Blurred vision, difficulty seeing at night, glare sensitivity', 'treatment': 'Surgical replacement of lens', 'severity': 'moderate'},
    {'name': 'Ear Infection', 'specialty': 'ENT Specialist', 'description': 'Infection in the middle ear', 'symptoms': 'Ear pain, fever, trouble sleeping, fluid drainage', 'treatment': 'Antibiotics, pain relievers', 'severity': 'mild'},
    {'name': 'Sinusitis', 'specialty': 'ENT Specialist', 'description': 'Inflammation of sinus cavities', 'symptoms': 'Facial pain, congestion, nasal discharge, headache', 'treatment': 'Decongestants, antibiotics, nasal sprays', 'severity': 'mild'},
    {'name': 'Pregnancy', 'specialty': 'Gynecologist', 'description': 'State of carrying a developing fetus', 'symptoms': 'Missed period, nausea, fatigue, breast changes', 'treatment': 'Prenatal care, supplements, regular checkups', 'severity': 'normal'},
    {'name': 'PCOS', 'specialty': 'Gynecologist', 'description': 'Polycystic ovary syndrome', 'symptoms': 'Irregular periods, weight gain, excess hair, acne', 'treatment': 'Lifestyle changes, medications', 'severity': 'moderate'},
    {'name': 'UTI', 'specialty': 'Urologist', 'description': 'Urinary tract infection', 'symptoms': 'Burning urination, frequent urination, cloudy urine', 'treatment': 'Antibiotics, increased fluid intake', 'severity': 'mild'},
    {'name': 'Kidney Stones', 'specialty': 'Urologist', 'description': 'Hard deposits in the kidney', 'symptoms': 'Severe flank pain, blood in urine, nausea', 'treatment': 'Pain medications, hydration, possible surgery', 'severity': 'moderate'},
    {'name': 'Gastritis', 'specialty': 'Gastroenterologist', 'description': 'Stomach lining inflammation', 'symptoms': 'Stomach pain, nausea, vomiting, indigestion', 'treatment': 'Antacids, avoid irritants, medications', 'severity': 'mild'},
    {'name': 'GERD', 'specialty': 'Gastroenterologist', 'description': 'Chronic acid reflux disease', 'symptoms': 'Heartburn, acid regurgitation, chronic cough', 'treatment': 'Lifestyle changes, medications', 'severity': 'mild'},
    {'name': 'Asthma', 'specialty': 'Pulmonologist', 'description': 'Chronic airway inflammation', 'symptoms': 'Wheezing, shortness of breath, chest tightness, coughing', 'treatment': 'Inhalers, medications, avoiding triggers', 'severity': 'moderate'},
    {'name': 'Pneumonia', 'specialty': 'Pulmonologist', 'description': 'Lung infection', 'symptoms': 'Cough, fever, chills, difficulty breathing', 'treatment': 'Antibiotics, rest, fluids', 'severity': 'severe'},
    {'name': 'Diabetes Type 2', 'specialty': 'Endocrinologist', 'description': 'Chronic condition affecting blood sugar', 'symptoms': 'Increased thirst, frequent urination, fatigue, slow healing', 'treatment': 'Lifestyle changes, medications, monitoring', 'severity': 'moderate'},
    {'name': 'Thyroid Disorder', 'specialty': 'Endocrinologist', 'description': 'Thyroid gland dysfunction', 'symptoms': 'Fatigue, weight changes, temperature sensitivity', 'treatment': 'Medications, lifestyle changes', 'severity': 'moderate'},
]

# Add diseases to database
created_count = 0
for disease_data in diseases_data:
    specialty = specialties.get(disease_data['specialty'])
    
    disease, created = Disease.objects.get_or_create(
        name=disease_data['name'],
        defaults={
            'specialty': specialty,
            'description': disease_data['description'],
            'symptoms': disease_data['symptoms'],
            'treatment': disease_data['treatment'],
            'severity': disease_data['severity']
        }
    )
    
    if created:
        created_count += 1
        print(f"Created disease: {disease_data['name']} ({disease_data['specialty']})")
    else:
        print(f"Disease already exists: {disease_data['name']}")

print(f"\n=== Summary ===")
print(f"Diseases created: {created_count}")
print(f"Total diseases in database: {Disease.objects.count()}")
