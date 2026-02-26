from django.core.management.base import BaseCommand
from core.models import DoctorSpecialty, Medication

class Command(BaseCommand):
    help = 'Initialize default specialties and medications'

    def handle(self, *args, **kwargs):
        # Create default specialties
        specialties = [
            {'name': 'General Physician', 'description': 'Primary care doctor for common illnesses', 'icon': '🩺'},
            {'name': 'Cardiologist', 'description': 'Heart and cardiovascular system', 'icon': '❤️'},
            {'name': 'Dermatologist', 'description': 'Skin, hair, and nails', 'icon': '🧴'},
            {'name': 'Neurologist', 'description': 'Brain and nervous system', 'icon': '🧠'},
            {'name': 'Orthopedic', 'description': 'Bones, joints, and muscles', 'icon': '🦴'},
            {'name': 'Pediatrician', 'description': 'Children\'s health', 'icon': '👶'},
            {'name': 'Psychiatrist', 'description': 'Mental health', 'icon': '🧘'},
            {'name': 'Ophthalmologist', 'description': 'Eye care', 'icon': '👁️'},
            {'name': 'ENT Specialist', 'description': 'Ear, nose, and throat', 'icon': '👃'},
            {'name': 'Gynecologist', 'description': 'Women\'s health', 'icon': '🌸'},
            {'name': 'Urologist', 'description': 'Urinary system', 'icon': '🔬'},
            {'name': 'Gastroenterologist', 'description': 'Digestive system', 'icon': '🍽️'},
            {'name': 'Pulmonologist', 'description': 'Lungs and respiratory', 'icon': '🫁'},
            {'name': 'Endocrinologist', 'description': 'Hormones and metabolism', 'icon': '💉'},
            {'name': 'Oncologist', 'description': 'Cancer treatment', 'icon': '🎗️'},
        ]
        
        specialties_created = 0
        for spec_data in specialties:
            if not DoctorSpecialty.objects.filter(name=spec_data['name']).exists():
                DoctorSpecialty.objects.create(**spec_data)
                specialties_created += 1
        
        # Create default medications
        medications = [
            {'name': 'Paracetamol 500mg', 'category': 'tablet', 'dosage': '500mg', 'uses': 'Fever, pain relief, headache', 'price_cents': 500},
            {'name': 'Amoxicillin 250mg', 'category': 'capsule', 'dosage': '250mg', 'uses': 'Bacterial infections', 'price_cents': 800},
            {'name': 'Ibuprofen 400mg', 'category': 'tablet', 'dosage': '400mg', 'uses': 'Pain, inflammation, fever', 'price_cents': 600},
            {'name': 'Azithromycin 500mg', 'category': 'tablet', 'dosage': '500mg', 'uses': 'Respiratory infections', 'price_cents': 1200},
            {'name': 'Cetirizine 10mg', 'category': 'tablet', 'dosage': '10mg', 'uses': 'Allergies, itching', 'price_cents': 400},
            {'name': 'Metformin 500mg', 'category': 'tablet', 'dosage': '500mg', 'uses': 'Type 2 diabetes', 'price_cents': 700},
            {'name': 'Omeprazole 20mg', 'category': 'capsule', 'dosage': '20mg', 'uses': 'Acid reflux, stomach ulcers', 'price_cents': 900},
            {'name': 'Aspirin 75mg', 'category': 'tablet', 'dosage': '75mg', 'uses': 'Pain, heart attack prevention', 'price_cents': 300},
            {'name': 'Vitamin D3 1000IU', 'category': 'tablet', 'dosage': '1000IU', 'uses': 'Vitamin D deficiency', 'price_cents': 450},
            {'name': 'Calcium Carbonate 500mg', 'category': 'tablet', 'dosage': '500mg', 'uses': 'Calcium deficiency', 'price_cents': 350},
            {'name': 'Cough Syrup', 'category': 'syrup', 'dosage': '100ml', 'uses': 'Cough and cold', 'price_cents': 550},
            {'name': 'Eye Drops', 'category': 'drops', 'dosage': '5ml', 'uses': 'Dry eyes, eye irritation', 'price_cents': 750},
        ]
        
        medications_created = 0
        for med_data in medications:
            if not Medication.objects.filter(name=med_data['name']).exists():
                Medication.objects.create(**med_data)
                medications_created += 1
        
        self.stdout.write(self.style.SUCCESS(
            f'Successfully created {specialties_created} specialties and {medications_created} medications'
        ))
