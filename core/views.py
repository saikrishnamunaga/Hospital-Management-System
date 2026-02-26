from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.core.cache import cache
from django.db import models
from django.utils import timezone
from datetime import timedelta
from .models import (
    Doctor, Patient, Appointment, Prescription, Invoice,
    DoctorSpecialty, Medication, PrescriptionItem,
    MedicationNotification, MedicineBill
)
from .serializers import (
    DoctorSerializer,
    PatientSerializer,
    AppointmentSerializer,
    PrescriptionSerializer,
    InvoiceSerializer,
    MedicineBillSerializer,
    UserCreateSerializer,
    UserSerializer,
    DoctorSpecialtySerializer,
    MedicationSerializer,
    PrescriptionItemSerializer,
    MedicationNotificationSerializer,
)


class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.method in permissions.SAFE_METHODS or (request.user and request.user.is_staff)


class UserMeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


@api_view(['GET'])
def api_root(request):
    """Root API endpoint"""
    return Response({
        'message': 'Welcome to Hospital Management System API',
        'endpoints': {
            'admin': '/admin/',
            'doctors': '/api/doctors/',
            'patients': '/api/patients/',
            'appointments': '/api/appointments/',
            'prescriptions': '/api/prescriptions/',
            'invoices': '/api/invoices/',
            'register': '/api/register/',
            'login': '/api/token/',
        }
    })


class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.select_related('user').all()
    serializer_class = PatientSerializer
    permission_classes = [permissions.IsAuthenticated]


class DoctorViewSet(viewsets.ModelViewSet):
    queryset = Doctor.objects.select_related('user', 'specialty').all()
    serializer_class = DoctorSerializer
    permission_classes = [IsAdminOrReadOnly]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        specialty_id = self.request.query_params.get('specialty')
        if specialty_id:
            queryset = queryset.filter(specialty_id=specialty_id)
        is_available = self.request.query_params.get('is_available')
        if is_available:
            queryset = queryset.filter(is_available=True)
        return queryset


class DoctorSpecialtyViewSet(viewsets.ModelViewSet):
    queryset = DoctorSpecialty.objects.all()
    serializer_class = DoctorSpecialtySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class MedicationViewSet(viewsets.ModelViewSet):
    queryset = Medication.objects.all()
    serializer_class = MedicationSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        in_stock = self.request.query_params.get('in_stock')
        if in_stock:
            queryset = queryset.filter(in_stock=True)
        return queryset


class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.select_related('doctor', 'patient').all()
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        if user.is_staff or user.role == 'admin':
            pass
        elif user.role == 'doctor':
            try:
                doctor = user.doctor_profile
                queryset = queryset.filter(doctor=doctor)
            except Doctor.DoesNotExist:
                queryset = queryset.none()
        elif user.role == 'patient':
            try:
                patient = user.patient_profile
                queryset = queryset.filter(patient=patient)
            except Patient.DoesNotExist:
                queryset = queryset.none()
        
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
            
        return queryset.order_by('scheduled_time')


class PrescriptionViewSet(viewsets.ModelViewSet):
    queryset = Prescription.objects.select_related('appointment').prefetch_related('items__medication').all()
    serializer_class = PrescriptionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        items_data = request.data.pop('items', [])
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        prescription = serializer.save()
        
        for item_data in items_data:
            PrescriptionItem.objects.create(
                prescription=prescription,
                medication_id=item_data.get('medication_id'),
                dosage=item_data.get('dosage', ''),
                duration=item_data.get('duration', ''),
                quantity=item_data.get('quantity', 1),
                instructions=item_data.get('instructions', '')
            )
        
        return Response(PrescriptionSerializer(prescription).data, status=status.HTTP_201_CREATED)


class PrescriptionItemViewSet(viewsets.ModelViewSet):
    queryset = PrescriptionItem.objects.select_related('medication').all()
    serializer_class = PrescriptionItemSerializer
    permission_classes = [permissions.IsAuthenticated]


class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.select_related('appointment', 'patient').all()
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        if user.is_staff or user.role == 'admin':
            pass
        elif user.role == 'doctor':
            try:
                doctor = user.doctor_profile
                # Show invoices for their appointments or invoices without appointments
                queryset = queryset.filter(
                    models.Q(appointment__doctor=doctor) |
                    models.Q(appointment__isnull=True)
                )
            except Doctor.DoesNotExist:
                queryset = queryset.none()
        elif user.role == 'patient':
            try:
                patient = user.patient_profile
                queryset = queryset.filter(patient=patient)
            except Patient.DoesNotExist:
                queryset = queryset.none()
        
        return queryset.order_by('-issued_at')
    
    def create(self, request, *args, **kwargs):
        # If appointment_id is provided, auto-populate patient from appointment
        appointment_id = request.data.get('appointment_id')
        if appointment_id:
            try:
                appointment = Appointment.objects.get(id=appointment_id)
                # Set patient from appointment if not provided
                if not request.data.get('patient_id') and appointment.patient:
                    request.data['patient_id'] = appointment.patient.id
            except Appointment.DoesNotExist:
                pass
        
        return super().create(request, *args, **kwargs)


class MedicineBillViewSet(viewsets.ModelViewSet):
    queryset = MedicineBill.objects.select_related('prescription_item__medication', 'patient__user').all()
    serializer_class = MedicineBillSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        if user.is_staff or user.role == 'admin':
            pass
        elif user.role == 'patient':
            try:
                patient = user.patient_profile
                queryset = queryset.filter(patient=patient)
            except Patient.DoesNotExist:
                queryset = queryset.none()
        
        return queryset.order_by('-created_at')


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UserCreateSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            if user.role == 'patient':
                try:
                    patient = user.patient_profile
                    patient_fields = [
                        'date_of_birth', 'gender', 'phone', 'address', 
                        'blood_group', 'emergency_contact'
                    ]
                    for field in patient_fields:
                        if field in request.data and request.data[field]:
                            setattr(patient, field, request.data[field])
                    patient.save()
                except Patient.DoesNotExist:
                    pass
            
            return Response(UserCreateSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DashboardSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        CACHE_KEY = f'dashboard:summary:{request.user.id}'
        summary = cache.get(CACHE_KEY)
        if summary:
            return Response(summary)

        user = request.user
        
        if user.is_staff or user.role == 'admin':
            total_appointments = Appointment.objects.count()
            upcoming = Appointment.objects.filter(status='booked').count()
            total_doctors = Doctor.objects.count()
            total_patients = Patient.objects.count()
            revenue_cents = Invoice.objects.filter(status='paid').aggregate(total=models.Sum('amount_cents'))['total'] or 0
        elif user.role == 'doctor':
            try:
                doctor = user.doctor_profile
                total_appointments = Appointment.objects.filter(doctor=doctor).count()
                upcoming = Appointment.objects.filter(doctor=doctor, status='booked').count()
                total_doctors = 1
                total_patients = Appointment.objects.filter(doctor=doctor).values('patient').distinct().count()
                revenue_cents = Invoice.objects.filter(appointment__doctor=doctor, status='paid').aggregate(total=models.Sum('amount_cents'))['total'] or 0
            except Doctor.DoesNotExist:
                total_appointments = 0
                upcoming = 0
                total_doctors = 0
                total_patients = 0
                revenue_cents = 0
        elif user.role == 'patient':
            try:
                patient = user.patient_profile
                total_appointments = Appointment.objects.filter(patient=patient).count()
                upcoming = Appointment.objects.filter(patient=patient, status='booked').count()
                total_doctors = Appointment.objects.filter(patient=patient).values('doctor').distinct().count()
                total_patients = 1
                revenue_cents = Invoice.objects.filter(patient=patient, status='paid').aggregate(total=models.Sum('amount_cents'))['total'] or 0
            except Patient.DoesNotExist:
                total_appointments = 10
                upcoming = 5
                total_doctors = 0
                total_patients = 0
                revenue_cents = 0
        else:
            total_appointments = 0
            upcoming = 0
            total_doctors = 0
            total_patients = 0
            revenue_cents = 0

        summary = {
            'total_appointments': total_appointments,
            'upcoming_appointments': upcoming,
            'total_doctors': total_doctors,
            'total_patients': total_patients,
            'revenue_cents': revenue_cents,
        }
        cache.set(CACHE_KEY, summary, timeout=300)
        return Response(summary)


class InitializeDataView(APIView):
    permission_classes = [permissions.IsAdminUser]
    
    def post(self, request):
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
        ]
        
        specialties_created = 0
        for spec_data in specialties:
            if not DoctorSpecialty.objects.filter(name=spec_data['name']).exists():
                DoctorSpecialty.objects.create(**spec_data)
                specialties_created += 1
        
        medications = [
            {'name': 'Paracetamol 500mg', 'category': 'tablet', 'dosage': '500mg', 'uses': 'Fever, pain relief', 'price_cents': 500},
            {'name': 'Amoxicillin 250mg', 'category': 'capsule', 'dosage': '250mg', 'uses': 'Bacterial infections', 'price_cents': 800},
            {'name': 'Ibuprofen 400mg', 'category': 'tablet', 'dosage': '400mg', 'uses': 'Pain, inflammation', 'price_cents': 600},
        ]
        
        medications_created = 0
        for med_data in medications:
            if not Medication.objects.filter(name=med_data['name']).exists():
                Medication.objects.create(**med_data)
                medications_created += 1
        
        return Response({
            'message': 'Data initialized successfully',
            'specialties_created': specialties_created,
            'medications_created': medications_created
        })


class MedicationNotificationViewSet(viewsets.ModelViewSet):
    queryset = MedicationNotification.objects.select_related(
        'patient__user', 'prescription_item__medication'
    ).all()
    serializer_class = MedicationNotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        if user.is_staff or user.role == 'admin':
            pass
        elif user.role == 'doctor':
            try:
                doctor = user.doctor_profile
                patient_ids = Appointment.objects.filter(doctor=doctor).values_list('patient_id', flat=True).distinct()
                queryset = MedicationNotification.objects.filter(patient_id__in=patient_ids)
            except Doctor.DoesNotExist:
                queryset = MedicationNotification.objects.none()
        elif user.role == 'patient':
            try:
                patient = user.patient_profile
                queryset = queryset.filter(patient=patient)
            except Patient.DoesNotExist:
                queryset = MedicationNotification.objects.none()
        else:
            queryset = MedicationNotification.objects.none()
        
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
            
        return queryset.order_by('scheduled_time')
    
    def create(self, request, *args, **kwargs):
        prescription_item_id = request.data.get('prescription_item')
        dosage = request.data.get('dosage', '')
        duration = request.data.get('duration', '7 days')
        
        try:
            days = int(duration.split()[0]) if duration else 7
        except:
            days = 7
        
        frequency = 1
        if 'twice' in dosage.lower() or '2 times' in dosage.lower():
            frequency = 2
        elif '3 times' in dosage.lower():
            frequency = 3
        
        try:
            prescription_item = PrescriptionItem.objects.get(id=prescription_item_id)
            patient = prescription_item.prescription.appointment.patient
        except PrescriptionItem.DoesNotExist:
            return Response({'error': 'Prescription item not found'}, status=status.HTTP_400_BAD_REQUEST)
        
        notifications_created = []
        base_time = timezone.now()
        
        for day in range(days):
            for freq in range(frequency):
                hour = 8 + (freq * 6)
                if frequency == 2:
                    hour = 8 + (freq * 8)
                
                scheduled_time = base_time + timedelta(days=day)
                scheduled_time = scheduled_time.replace(hour=hour, minute=0, second=0)
                
                notification = MedicationNotification.objects.create(
                    patient=patient,
                    prescription_item=prescription_item,
                    scheduled_time=scheduled_time,
                    status='pending'
                )
                notifications_created.append(notification)
        
        return Response(
            MedicationNotificationSerializer(notifications_created, many=True).data,
            status=status.HTTP_201_CREATED
        )


class MarkMedicationTakenView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        notification_id = request.data.get('notification_id')
        try:
            notification = MedicationNotification.objects.get(id=notification_id)
            
            if request.user.role == 'patient':
                try:
                    patient = request.user.patient_profile
                    if notification.patient != patient:
                        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
                except Patient.DoesNotExist:
                    return Response({'error': 'Patient profile not found'}, status=status.HTTP_400_BAD_REQUEST)
            
            notification.status = 'taken'
            notification.taken_time = timezone.now()
            notification.save()
            
            return Response(MedicationNotificationSerializer(notification).data)
        except MedicationNotification.DoesNotExist:
            return Response({'error': 'Notification not found'}, status=status.HTTP_404_NOT_FOUND)


class SkipMedicationView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        notification_id = request.data.get('notification_id')
        reason = request.data.get('reason', '')
        try:
            notification = MedicationNotification.objects.get(id=notification_id)
            
            if request.user.role == 'patient':
                try:
                    patient = request.user.patient_profile
                    if notification.patient != patient:
                        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
                except Patient.DoesNotExist:
                    return Response({'error': 'Patient profile not found'}, status=status.HTTP_400_BAD_REQUEST)
            
            notification.status = 'skipped'
            notification.notes = reason
            notification.save()
            
            return Response(MedicationNotificationSerializer(notification).data)
        except MedicationNotification.DoesNotExist:
            return Response({'error': 'Notification not found'}, status=status.HTTP_404_NOT_FOUND)


class UpcomingMedicationsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        if user.role != 'patient':
            return Response({'error': 'Only patients can view their medications'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            patient = user.patient_profile
        except Patient.DoesNotExist:
            return Response({'error': 'Patient profile not found'}, status=status.HTTP_400_BAD_REQUEST)
        
        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        
        notifications = MedicationNotification.objects.filter(
            patient=patient,
            scheduled_time__gte=today_start,
            scheduled_time__lt=today_end
        ).select_related('prescription_item__medication').order_by('scheduled_time')
        
        return Response(MedicationNotificationSerializer(notifications, many=True).data)
