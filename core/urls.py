from rest_framework import routers
from django.urls import path, include
from .views import (
    DoctorViewSet,
    PatientViewSet,
    AppointmentViewSet,
    PrescriptionViewSet,
    InvoiceViewSet,
    MedicineBillViewSet,
    RegisterView,
    DashboardSummaryView,
    DoctorSpecialtyViewSet,
    MedicationViewSet,
    PrescriptionItemViewSet,
    InitializeDataView,
    UserMeView,
    MedicationNotificationViewSet,
    MarkMedicationTakenView,
    SkipMedicationView,
    UpcomingMedicationsView,
)
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


router = routers.DefaultRouter()
router.register(r'doctors', DoctorViewSet)
router.register(r'patients', PatientViewSet)
router.register(r'appointments', AppointmentViewSet)
router.register(r'prescriptions', PrescriptionViewSet)
router.register(r'prescription-items', PrescriptionItemViewSet)
router.register(r'invoices', InvoiceViewSet)
router.register(r'medicine-bills', MedicineBillViewSet)
router.register(r'specialties', DoctorSpecialtyViewSet)
router.register(r'medications', MedicationViewSet)
router.register(r'medication-notifications', MedicationNotificationViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/register/', RegisterView.as_view(), name='auth_register'),
    path('dashboard/summary/', DashboardSummaryView.as_view(), name='dashboard_summary'),
    path('init/', InitializeDataView.as_view(), name='initialize_data'),
    path('users/me/', UserMeView.as_view(), name='user_me'),
    path('medications/taken/', MarkMedicationTakenView.as_view(), name='mark_medication_taken'),
    path('medications/skip/', SkipMedicationView.as_view(), name='skip_medication'),
    path('medications/upcoming/', UpcomingMedicationsView.as_view(), name='upcoming_medications'),
]
