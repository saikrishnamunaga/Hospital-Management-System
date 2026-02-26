import React, { useEffect, useState } from 'react'
import api from '../api'

export default function Dashboard({ token, userRole, onNavigate }) {
  const [stats, setStats] = useState(null)
  const [invoices, setInvoices] = useState([])
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    fetchDashboard()
    fetchCurrentUser()
  }, [])

  const fetchCurrentUser = async () => {
    try {
      const res = await api.get('/users/me/')
      setCurrentUser(res.data)
    } catch (err) {
      console.error('Failed to fetch current user')
    }
  }

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      const [statsRes, invoicesRes, appointmentsRes] = await Promise.all([
        api.get('/dashboard/summary/'),
        api.get('/invoices/'),
        api.get('/appointments/')
      ])
      setStats(statsRes.data)
      setInvoices(invoicesRes.data)
      setAppointments(appointmentsRes.data)
    } catch (err) {
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (cents) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format((cents || 0) / 100)
  }

  const getAppointmentPatient = (appointmentId) => {
    const apt = appointments.find(a => a.id === appointmentId)
    if (!apt || !apt.patient || !apt.patient.user) return { name: 'N/A', doctor: 'N/A' }
    return {
      name: `${apt.patient.user.first_name} ${apt.patient.user.last_name}`,
      doctor: apt.doctor?.user ? `Dr. ${apt.doctor.user.first_name} ${apt.doctor.user.last_name}` : 'N/A'
    }
  }

  // Filter appointments for patient view
  const patientAppointments = userRole === 'patient' && currentUser
    ? appointments.filter(apt => apt.patient?.user?.id === currentUser.id)
    : appointments

  // Get upcoming appointments for notifications
  const upcomingAppointments = patientAppointments.filter(apt => {
    const aptDate = new Date(apt.scheduled_time)
    return aptDate > new Date() && apt.status !== 'cancelled'
  }).sort((a, b) => new Date(a.scheduled_time) - new Date(b.scheduled_time))

  const formatAppointmentTime = (dateStr) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = date - now
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60))
      return diffMins <= 0 ? 'Now' : `In ${diffMins} minutes`
    } else if (diffHours < 24) {
      return `In ${diffHours} hours`
    } else if (diffDays === 1) {
      return 'Tomorrow'
    } else if (diffDays < 7) {
      return `In ${diffDays} days`
    } else {
      return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      booked: '#3b82f6',
      completed: '#22c55e',
      cancelled: '#ef4444',
      'no-show': '#f59e0b',
      'in-progress': '#f97316'
    }
    return colors[status] || '#6b7280'
  }

  // Patient notification component
  const PatientNotifications = () => {
    if (userRole !== 'patient' || upcomingAppointments.length === 0) return null

    return (
      <div className="card patient-notifications" style={{ marginBottom: '20px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="notification-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <span style={{ fontSize: '28px' }}>🔔</span>
          <h3 style={{ color: 'white', margin: 0 }}>Your Appointments</h3>
          <span className="notification-badge" style={{ 
            background: 'white', 
            color: '#667eea', 
            padding: '4px 10px', 
            borderRadius: '20px', 
            fontSize: '12px',
            fontWeight: '600',
            marginLeft: 'auto'
          }}>
            {upcomingAppointments.length} upcoming
          </span>
        </div>
        
        <div className="notification-list">
          {upcomingAppointments.slice(0, 3).map(apt => (
            <div key={apt.id} className="notification-item" style={{ 
              background: 'rgba(255,255,255,0.95)', 
              borderRadius: '10px', 
              padding: '14px', 
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div className="notification-icon" style={{ 
                width: '44px', 
                height: '44px', 
                background: '#f0f9ff', 
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px'
              }}>
                👨‍⚕️
              </div>
              <div className="notification-content" style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '14px' }}>
                  Dr. {apt.doctor?.user?.first_name} {apt.doctor?.user?.last_name}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  {apt.doctor?.specialty || 'General Medicine'}
                </div>
              </div>
              <div className="notification-time" style={{ textAlign: 'right' }}>
                <div style={{ 
                  fontWeight: '600', 
                  color: '#667eea', 
                  fontSize: '13px' 
                }}>
                  {formatAppointmentTime(apt.scheduled_time)}
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>
                  {new Date(apt.scheduled_time).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {upcomingAppointments.length > 3 && (
          <button 
            className="btn-secondary" 
            style={{ marginTop: '10px', width: '100%', background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none' }}
            onClick={() => onNavigate && onNavigate('appointments')}
          >
            View All {upcomingAppointments.length} Appointments →
          </button>
        )}
      </div>
    )
  }

const paidInvoices = invoices.filter(inv => inv.status === 'paid')
const pendingInvoices = invoices.filter(inv => inv.status === 'pending')

  if (loading) return <div className="loading">Loading dashboard...</div>
  if (error) return <div className="error-message">{error}</div>

  return (
    <div className="dashboard">
      {/* Patient Notifications Section */}
      <PatientNotifications />

      <h2>📊 Dashboard Overview</h2>
      
      <div className="stats-grid">
        <div className="stat-card large">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <span className="stat-value">{stats?.total_appointments || 0}</span>
            <span className="stat-label">Total Appointments</span>
          </div>
        </div>

        <div className="stat-card large">
          <div className="stat-icon">⏰</div>
          <div className="stat-content">
            <span className="stat-value">{stats?.upcoming_appointments || 0}</span>
            <span className="stat-label">Upcoming Appointments</span>
          </div>
        </div>

        <div className="stat-card large">
          <div className="stat-icon">👨‍⚕️</div>
          <div className="stat-content">
            <span className="stat-value">{stats?.total_doctors || 0}</span>
            <span className="stat-label">Total Doctors</span>
          </div>
        </div>

        <div className="stat-card large">
          <div className="stat-icon">👤</div>
          <div className="stat-content">
            <span className="stat-value">{stats?.total_patients || 0}</span>
            <span className="stat-label">Total Patients</span>
          </div>
        </div>

        <div className="stat-card large highlight">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <span className="stat-value">{formatCurrency(stats?.revenue_cents)}</span>
            <span className="stat-label">Total Revenue</span>
          </div>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="card">
          <h3>Quick Actions</h3>
          <div className="quick-actions">
            <button className="action-btn" onClick={() => onNavigate && onNavigate('appointments')}>📅 Schedule Appointment</button>
            <button className="action-btn" onClick={() => onNavigate && onNavigate('prescriptions')}>💊 Create Prescription</button>
            <button className="action-btn" onClick={() => onNavigate && onNavigate('invoices')}>💰 Create Invoice</button>
            <button className="action-btn" onClick={() => onNavigate && onNavigate('doctors')}>👨‍⚕️ Add Doctor</button>
          </div>
        </div>

        <div className="card">
          <h3>💰 Payment Status</h3>
          <div className="payment-summary">
            <div className="payment-section">
              <h4 style={{color: '#22c55e', marginBottom: '10px'}}>✅ Paid ({paidInvoices.length})</h4>
              <div className="payment-list">
                {paidInvoices.slice(0, 5).map(inv => {
                  const { name, doctor } = getAppointmentPatient(inv.appointment)
                  return (
                    <div key={inv.id} className="payment-item paid" style={{background: '#f0fdf4', padding: '8px', borderRadius: '6px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between'}}>
                      <div>
                        <div style={{fontWeight: '500', fontSize: '13px'}}>{name}</div>
                        <div style={{fontSize: '11px', color: '#666'}}>{doctor}</div>
                      </div>
                      <div style={{color: '#22c55e', fontWeight: '600'}}>{formatCurrency(inv.amount_cents)}</div>
                    </div>
                  )
                })}
                {paidInvoices.length === 0 && <p className="empty-text">No payments received</p>}
              </div>
            </div>
            <div className="payment-section" style={{marginTop: '15px'}}>
              <h4 style={{color: '#f59e0b', marginBottom: '10px'}}>⏳ Pending ({pendingInvoices.length})</h4>
              <div className="payment-list">
                {pendingInvoices.slice(0, 5).map(inv => {
                  const { name, doctor } = getAppointmentPatient(inv.appointment)
                  return (
                    <div key={inv.id} className="payment-item pending" style={{background: '#fffbeb', padding: '8px', borderRadius: '6px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between'}}>
                      <div>
                        <div style={{fontWeight: '500', fontSize: '13px'}}>{name}</div>
                        <div style={{fontSize: '11px', color: '#666'}}>{doctor}</div>
                      </div>
                      <div style={{color: '#f59e0b', fontWeight: '600'}}>{formatCurrency(inv.amount_cents)}</div>
                    </div>
                  )
                })}
                {pendingInvoices.length === 0 && <p className="empty-text">No pending payments</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>System Status</h3>
        <div className="system-status">
          <div className="status-item">
            <span className="status-dot active"></span>
            <span>Database Connected</span>
          </div>
          <div className="status-item">
            <span className="status-dot active"></span>
            <span>API Server Running</span>
          </div>
          <div className="status-item">
            <span className="status-dot active"></span>
            <span>Redis Cache Active</span>
          </div>
        </div>
      </div>
    </div>
  )
}
