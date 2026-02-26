from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('doctor', 'Doctor'),
        ('patient', 'Patient'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='patient')

class DoctorSpecialty(models.Model):
    """Model for doctor specializations/specialties"""
    name = models.CharField(max_length=128, unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True)  # For UI icons
    
    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name_plural = "Doctor Specialties"

class Doctor(models.Model):
    user = models.OneToOneField('core.User', on_delete=models.CASCADE, related_name='doctor_profile')
    specialty = models.ForeignKey(DoctorSpecialty, on_delete=models.SET_NULL, null=True, blank=True, related_name='doctors')
    qualifications = models.TextField(blank=True)
    license_number = models.CharField(max_length=50, blank=True)
    experience_years = models.IntegerField(default=0)
    bio = models.TextField(blank=True)
    consultation_fee = models.IntegerField(default=0)  # In cents
    is_available = models.BooleanField(default=True)

    def __str__(self):
        return f"Dr. {self.user.get_full_name()} - {self.specialty.name if self.specialty else 'General'}"

class Patient(models.Model):
    GENDER_CHOICES = (
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
    )
    user = models.OneToOneField('core.User', on_delete=models.CASCADE, related_name='patient_profile')
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    blood_group = models.CharField(max_length=10, blank=True)
    emergency_contact = models.CharField(max_length=20, blank=True)
    medical_history = models.JSONField(default=list)  # List of past conditions
    allergies = models.JSONField(default=list)  # List of allergies
    current_symptoms = models.JSONField(default=list)  # Current symptoms
    lab_reports = models.JSONField(default=list)  # Lab reports URLs/data
    emergency_warnings = models.JSONField(default=list)  # Emergency warnings

    def __str__(self):
        return self.user.get_full_name()

class Appointment(models.Model):
    STATUS_CHOICES = (
        ('booked', 'Booked'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
        ('no-show', 'No-show'),
        ('in-progress', 'In Progress'),
    )
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='appointments')
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='appointments')
    scheduled_time = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='booked')
    reason = models.TextField(blank=True)
    notes = models.TextField(blank=True)

class Medication(models.Model):
    """Model for medications with types and uses"""
    CATEGORY_CHOICES = (
        ('tablet', 'Tablet'),
        ('capsule', 'Capsule'),
        ('syrup', 'Syrup'),
        ('injection', 'Injection'),
        ('ointment', 'Ointment'),
        ('drops', 'Drops'),
        ('inhaler', 'Inhaler'),
        ('patch', 'Patch'),
        ('suppository', 'Suppository'),
    )
    
    name = models.CharField(max_length=256)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    dosage = models.CharField(max_length=100)  # e.g., "500mg", "10ml"
    manufacturer = models.CharField(max_length=256, blank=True)
    uses = models.TextField()  # What conditions this medication treats
    side_effects = models.TextField(blank=True)
    precautions = models.TextField(blank=True)
    price_cents = models.IntegerField(default=0)
    in_stock = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.name} ({self.get_category_display()})"

class Prescription(models.Model):
    appointment = models.OneToOneField(Appointment, on_delete=models.CASCADE, related_name='prescription')
    prescribed_at = models.DateTimeField(auto_now_add=True)
    diagnosis = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    
    def __str__(self):
        return f"Prescription for {self.appointment.patient} - {self.prescribed_at}"

class PrescriptionItem(models.Model):
    """Individual medications prescribed"""
    prescription = models.ForeignKey(Prescription, on_delete=models.CASCADE, related_name='items')
    medication = models.ForeignKey(Medication, on_delete=models.CASCADE)
    dosage = models.CharField(max_length=100)  # e.g., "1 tablet twice daily"
    duration = models.CharField(max_length=100)  # e.g., "7 days"
    quantity = models.IntegerField(default=1)
    instructions = models.TextField(blank=True)  # Special instructions
    
    def __str__(self):
        return f"{self.medication.name} - {self.dosage}"


class MedicationNotification(models.Model):
    """Model for medication reminders/notifications for patients"""
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='medication_notifications')
    prescription_item = models.ForeignKey(PrescriptionItem, on_delete=models.CASCADE, related_name='notifications')
    scheduled_time = models.DateTimeField()  # When the medication should be taken
    taken_time = models.DateTimeField(null=True, blank=True)  # When the patient actually took it
    status = models.CharField(
        max_length=20,
        choices=(
            ('pending', 'Pending'),
            ('taken', 'Taken'),
            ('skipped', 'Skipped'),
            ('missed', 'Missed'),
        ),
        default='pending'
    )
    reminder_sent = models.BooleanField(default=False)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.patient} - {self.prescription_item.medication.name} - {self.scheduled_time}"

class Invoice(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('cancelled', 'Cancelled'),
        ('refunded', 'Refunded'),
    )
    BILL_TYPE_CHOICES = (
        ('consultation', 'Consultation Fee'),
        ('medicine', 'Medicine Fee'),
    )
    appointment = models.ForeignKey(Appointment, on_delete=models.CASCADE, related_name='invoices', null=True, blank=True)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='invoices', null=True, blank=True)
    bill_type = models.CharField(max_length=20, choices=BILL_TYPE_CHOICES, default='consultation')
    amount_cents = models.IntegerField()
    currency = models.CharField(max_length=8, default='INR')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    issued_at = models.DateTimeField(auto_now_add=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    description = models.TextField(blank=True)
    
    def __str__(self):
        return f"Invoice #{self.id} - {self.amount_cents/100} {self.currency}"


class MedicineBill(models.Model):
    """Model for tracking medicine purchases from prescriptions"""
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='medicine_bills')
    prescription_item = models.ForeignKey(PrescriptionItem, on_delete=models.CASCADE, related_name='medicine_bills')
    quantity = models.IntegerField(default=1)
    unit_price_cents = models.IntegerField()
    total_price_cents = models.IntegerField()
    status = models.CharField(max_length=20, choices=Invoice.STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"Medicine Bill #{self.id} - {self.prescription_item.medication.name}"


class Disease(models.Model):
    """Model for diseases/conditions"""
    SEVERITY_CHOICES = [
        ('mild', 'Mild'),
        ('moderate', 'Moderate'),
        ('severe', 'Severe'),
        ('normal', 'Normal'),
    ]
    
    name = models.CharField(max_length=256)
    specialty = models.ForeignKey(DoctorSpecialty, on_delete=models.SET_NULL, null=True, blank=True, related_name='diseases')
    description = models.TextField()
    symptoms = models.TextField()
    treatment = models.TextField()
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='mild')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name_plural = "Diseases"

# Default data for specializations
DEFAULT_SPECIALTIES = [
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

# Default medications
DEFAULT_MEDICATIONS = [
    {'name': 'Paracetamol 500mg', 'category': 'tablet', 'dosage': '500mg', 'uses': 'Fever, pain relief, headache'},
    {'name': 'Amoxicillin 250mg', 'category': 'capsule', 'dosage': '250mg', 'uses': 'Bacterial infections'},
    {'name': 'Ibuprofen 400mg', 'category': 'tablet', 'dosage': '400mg', 'uses': 'Pain, inflammation, fever'},
    {'name': 'Azithromycin 500mg', 'category': 'tablet', 'dosage': '500mg', 'uses': 'Respiratory infections'},
    {'name': 'Cetirizine 10mg', 'category': 'tablet', 'dosage': '10mg', 'uses': 'Allergies, itching'},
    {'name': 'Metformin 500mg', 'category': 'tablet', 'dosage': '500mg', 'uses': 'Type 2 diabetes'},
    {'name': 'Omeprazole 20mg', 'category': 'capsule', 'dosage': '20mg', 'uses': 'Acid reflux, stomach ulcers'},
    {'name': 'Aspirin 75mg', 'category': 'tablet', 'dosage': '75mg', 'uses': 'Pain, heart attack prevention'},
    {'name': 'Vitamin D3 1000IU', 'category': 'tablet', 'dosage': '1000IU', 'uses': 'Vitamin D deficiency'},
    {'name': 'Calcium Carbonate 500mg', 'category': 'tablet', 'dosage': '500mg', 'uses': 'Calcium deficiency'},
    {'name': 'Cough Syrup', 'category': 'syrup', 'dosage': '10ml', 'uses': 'Cough and cold'},
    {'name': 'Eye Drops', 'category': 'drops', 'dosage': '5ml', 'uses': 'Dry eyes, eye irritation'},
]


class Message(models.Model):
    """Model for messaging between patients and doctors"""
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages')
    appointment = models.ForeignKey(Appointment, on_delete=models.SET_NULL, null=True, blank=True, related_name='messages')
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Message from {self.sender.username} to {self.recipient.username}"
    
    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = "Messages"
