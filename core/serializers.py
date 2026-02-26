from rest_framework import serializers
from .models import (
    User, Doctor, Patient, Appointment, Prescription, 
    Invoice, DoctorSpecialty, Medication, PrescriptionItem,
    MedicationNotification, MedicineBill, Message
)

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id','username','first_name','last_name','email','role']


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id','username','email','first_name','last_name','password','role']

    def create(self, validated_data):
        password = validated_data.pop('password')
        role = validated_data.get('role', 'patient')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        if role == 'doctor':
            Doctor.objects.create(user=user)
        else:
            Patient.objects.create(user=user)
        return user

class DoctorSpecialtySerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorSpecialty
        fields = ['id', 'name', 'description', 'icon']

class DoctorSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    specialty_name = serializers.CharField(source='specialty.name', read_only=True)
    
    class Meta:
        model = Doctor
        fields = [
            'id', 'user', 'specialty', 'specialty_name', 'qualifications',
            'license_number', 'experience_years', 'bio', 'consultation_fee', 'is_available'
        ]

class PatientSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Patient
        fields = [
            'id', 'user', 'date_of_birth', 'gender', 'phone', 
            'address', 'blood_group', 'emergency_contact', 'medical_history',
            'allergies', 'current_symptoms', 'lab_reports', 'emergency_warnings'
        ]

class AppointmentSerializer(serializers.ModelSerializer):
    doctor = DoctorSerializer(read_only=True)
    patient = PatientSerializer(read_only=True)
    doctor_id = serializers.IntegerField(write_only=True, required=False)
    patient_id = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = Appointment
        fields = [
            'id', 'doctor', 'patient', 'doctor_id', 'patient_id', 
            'scheduled_time', 'status', 'reason', 'notes'
        ]
    
    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['doctor_id'] = instance.doctor_id
        ret['patient_id'] = instance.patient_id
        return ret
    
    def create(self, validated_data):
        return Appointment.objects.create(**validated_data)

class MedicationSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    
    class Meta:
        model = Medication
        fields = [
            'id', 'name', 'category', 'category_display', 'dosage',
            'manufacturer', 'uses', 'side_effects', 'precautions',
            'price_cents', 'in_stock'
        ]

class PrescriptionItemSerializer(serializers.ModelSerializer):
    medication = MedicationSerializer(read_only=True)
    medication_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = PrescriptionItem
        fields = ['id', 'medication', 'medication_id', 'dosage', 'duration', 'quantity', 'instructions']

class PrescriptionSerializer(serializers.ModelSerializer):
    appointment = AppointmentSerializer(read_only=True)
    appointment_id = serializers.IntegerField(write_only=True, required=False)
    items = PrescriptionItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = Prescription
        fields = [
            'id', 'appointment', 'appointment_id', 'prescribed_at',
            'diagnosis', 'notes', 'items'
        ]

class InvoiceSerializer(serializers.ModelSerializer):
    appointment = AppointmentSerializer(read_only=True)
    appointment_id = serializers.IntegerField(write_only=True, required=False)
    patient = PatientSerializer(read_only=True)
    patient_id = serializers.IntegerField(write_only=True, required=False)
    patient_name = serializers.SerializerMethodField()
    doctor_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'appointment', 'appointment_id', 'patient', 'patient_id',
            'patient_name', 'doctor_name', 'bill_type', 'amount_cents', 
            'currency', 'status', 'issued_at', 'paid_at', 'description'
        ]
    
    def get_patient_name(self, obj):
        if obj.patient:
            return obj.patient.user.get_full_name() or obj.patient.user.username
        if obj.appointment and obj.appointment.patient:
            return obj.appointment.patient.user.get_full_name() or obj.appointment.patient.user.username
        return None
    
    def get_doctor_name(self, obj):
        if obj.appointment and obj.appointment.doctor:
            return f"Dr. {obj.appointment.doctor.user.get_full_name()}"
        return None
    
    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['patient_id'] = instance.patient_id
        ret['appointment_id'] = instance.appointment_id
        return ret


class MedicineBillSerializer(serializers.ModelSerializer):
    patient = PatientSerializer(read_only=True)
    patient_id = serializers.IntegerField(write_only=True, required=False)
    medication_name = serializers.CharField(source='prescription_item.medication.name', read_only=True)
    
    class Meta:
        model = MedicineBill
        fields = [
            'id', 'patient', 'patient_id', 'prescription_item',
            'medication_name', 'quantity', 'unit_price_cents', 'total_price_cents',
            'status', 'created_at', 'paid_at'
        ]
    
    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['patient_id'] = instance.patient_id
        return ret


class MedicationNotificationSerializer(serializers.ModelSerializer):
    medication_name = serializers.CharField(source='prescription_item.medication.name', read_only=True)
    dosage = serializers.CharField(source='prescription_item.dosage', read_only=True)
    patient_name = serializers.CharField(source='patient.user.get_full_name', read_only=True)
    
    class Meta:
        model = MedicationNotification
        fields = [
            'id', 'patient', 'patient_name', 'prescription_item', 
            'medication_name', 'dosage', 'scheduled_time', 'taken_time',
            'status', 'reminder_sent', 'notes', 'created_at'
        ]


class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    recipient = UserSerializer(read_only=True)
    sender_id = serializers.IntegerField(write_only=True, required=False)
    recipient_id = serializers.IntegerField(write_only=True, required=False)
    sender_name = serializers.CharField(source='sender.get_full_name', read_only=True)
    recipient_name = serializers.CharField(source='recipient.get_full_name', read_only=True)
    
    class Meta:
        model = Message
        fields = [
            'id', 'sender', 'recipient', 'sender_id', 'recipient_id',
            'sender_name', 'recipient_name', 'appointment', 'content',
            'is_read', 'created_at'
        ]
    
    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['sender_id'] = instance.sender_id
        ret['recipient_id'] = instance.recipient_id
        return ret
    
    def create(self, validated_data):
        return Message.objects.create(**validated_data)
