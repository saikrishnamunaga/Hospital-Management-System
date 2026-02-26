import React, { useEffect, useState } from 'react'
import api from '../api'

export default function Patients({ token, userRole }) {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [patientAppointments, setPatientAppointments] = useState([])
  const [patientPrescriptions, setPatientPrescriptions] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showReminderModal, setShowReminderModal] = useState(false)
  const [reminderNotifications, setReminderNotifications] = useState([])

  useEffect(() => {
    fetchPatients()
  }, [])

  const fetchPatients = async () => {
    try {
      setLoading(true)
      const res = await api.get('/patients/')
      setPatients(res.data)
    } catch (err) {
      // Check if it's a timeout error
      if (err.status === 408 || err.message?.includes('timed out')) {
        setError('Request timed out. The server is taking too long to respond. Please try again.')
      } else {
        setError('Failed to load patients')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleViewPatient = async (patient) => {
    setSelectedPatient(patient)
    try {
      const aptsRes = await api.get('/appointments/')
      const allApts = aptsRes.data.filter(a => a.patient?.id === patient.id)
      setPatientAppointments(allApts)

      const rxRes = await api.get('/prescriptions/')
      const allRx = rxRes.data.filter(rx => {
        const apt = allApts.find(a => a.id === rx.appointment_id)
        return apt !== undefined
      })
      setPatientPrescriptions(allRx)

      setShowModal(true)
    } catch (err) {
      setError('Failed to load patient details')
    }
  }

  const handleViewReminders = async (patient) => {
    try {
      const rxRes = await api.get('/prescriptions/')
      const aptsRes = await api.get('/appointments/')
      const patientApts = aptsRes.data.filter(a => a.patient?.id === patient.id)
      
      const allRx = rxRes.data.filter(rx => {
        const apt = patientApts.find(a => a.id === rx.appointment_id)
        return apt !== undefined && apt.status === 'completed'
      })

      // Generate reminders from prescriptions
      const notifications = []
      allRx.forEach(rx => {
        if (rx.items && rx.items.length > 0) {
          rx.items.forEach(item => {
            notifications.push({
              medication: item.medication?.name || 'Unknown',
              dosage: item.dosage,
              duration: item.duration,
              instructions: item.instructions,
              prescribedDate: rx.prescribed_at,
              diagnosis: rx.diagnosis
            })
          })
        }
      })
      
      setReminderNotifications(notifications)
      setShowReminderModal(true)
    } catch (err) {
      setError('Failed to load reminders')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this patient?')) return
    try {
      await api.delete(`/patients/${id}/`)
      fetchPatients()
    } catch (err) {
      setError('Failed to delete patient')
    }
  }

  const filteredPatients = patients.filter(patient => {
    const fullName = `${patient.user?.first_name || ''} ${patient.user?.last_name || ''}`.toLowerCase()
    return fullName.includes(searchTerm.toLowerCase()) ||
           (patient.phone && patient.phone.includes(searchTerm)) ||
           (patient.blood_group && patient.blood_group.toLowerCase().includes(searchTerm.toLowerCase()))
  })

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
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

  if (loading) return <div className="loading">Loading patients...</div>

  return (
    <div className="card">
      <div className="card-header">
        <h2>👤 Patients</h2>
        <div className="header-actions">
          <input
            type="text"
            placeholder="Search patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {filteredPatients.length === 0 ? (
        <p className="empty-state">No patients found</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Blood Group</th>
              <th>Gender</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPatients.map((patient) => (
              <tr key={patient.id} onClick={() => handleViewPatient(patient)} style={{cursor: 'pointer'}}>
                <td>{patient.user?.first_name} {patient.user?.last_name}</td>
                <td>{patient.user?.email || '-'}</td>
                <td>{patient.phone || '-'}</td>
                <td>{patient.blood_group || '-'}</td>
                <td>{patient.gender || '-'}</td>
                <td onClick={e => e.stopPropagation()}>
                  {userRole === 'admin' && (
                    <button 
                      className="btn-danger"
                      onClick={() => handleDelete(patient.id)}
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Patient Details Modal */}
      {showModal && selectedPatient && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Patient Details</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              {/* Personal Information */}
              <div className="patient-details-section">
                <h4>📋 Personal Information</h4>
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="label">Name:</span>
                    <span className="value">{selectedPatient.user?.first_name} {selectedPatient.user?.last_name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Email:</span>
                    <span className="value">{selectedPatient.user?.email || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Phone:</span>
                    <span className="value">{selectedPatient.phone || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Date of Birth:</span>
                    <span className="value">{formatDate(selectedPatient.date_of_birth)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Gender:</span>
                    <span className="value">{selectedPatient.gender || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Blood Group:</span>
                    <span className="value">{selectedPatient.blood_group || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Emergency Contact:</span>
                    <span className="value">{selectedPatient.emergency_contact || '-'}</span>
                  </div>
                  <div className="detail-item full-width">
                    <span className="label">Address:</span>
                    <span className="value">{selectedPatient.address || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Allergies - Important for Patient */}
              {(selectedPatient.allergies && selectedPatient.allergies.length > 0) && (
                <div className="patient-details-section">
                  <h4>⚠️ Allergies</h4>
                  <div className="tags-list">
                    {selectedPatient.allergies.map((allergy, idx) => (
                      <span key={idx} className="tag danger">{allergy}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Current Symptoms */}
              {(selectedPatient.current_symptoms && selectedPatient.current_symptoms.length > 0) && (
                <div className="patient-details-section">
                  <h4>🤒 Current Symptoms</h4>
                  <div className="tags-list">
                    {selectedPatient.current_symptoms.map((symptom, idx) => (
                      <span key={idx} className="tag warning">{symptom}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Emergency Warnings */}
              {(selectedPatient.emergency_warnings && selectedPatient.emergency_warnings.length > 0) && (
                <div className="patient-details-section">
                  <h4>🚨 Emergency Warnings</h4>
                  <div className="tags-list">
                    {selectedPatient.emergency_warnings.map((warning, idx) => (
                      <span key={idx} className="tag danger">{warning}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Appointments Section */}
              <div className="patient-details-section">
                <h4>📅 Appointments ({patientAppointments.length})</h4>
                {patientAppointments.length === 0 ? (
                  <p className="empty-text">No appointments</p>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Doctor</th>
                        <th>Date & Time</th>
                        <th>Reason</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patientAppointments.map(apt => (
                        <tr key={apt.id}>
                          <td>Dr. {apt.doctor?.user?.first_name} {apt.doctor?.user?.last_name}</td>
                          <td>{formatDateTime(apt.scheduled_time)}</td>
                          <td>{apt.reason || '-'}</td>
                          <td>
                            <span 
                              className="status-badge" 
                              style={{ backgroundColor: getStatusColor(apt.status) }}
                            >
                              {apt.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Prescriptions Section */}
              <div className="patient-details-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4>💊 Prescriptions ({patientPrescriptions.length})</h4>
                  {patientPrescriptions.length > 0 && (
                    <button 
                      className="btn-primary btn-sm"
                      onClick={() => handleViewReminders(selectedPatient)}
                    >
                      🔔 View Medication Reminders
                    </button>
                  )}
                </div>
                {patientPrescriptions.length === 0 ? (
                  <p className="empty-text">No prescriptions</p>
                ) : (
                  <div className="prescriptions-list">
                    {patientPrescriptions.map(rx => (
                      <div key={rx.id} className="prescription-card">
                        <div className="prescription-header">
                          <span className="date">{formatDate(rx.prescribed_at)}</span>
                          {rx.diagnosis && <span className="diagnosis">{rx.diagnosis}</span>}
                        </div>
                        {rx.items && rx.items.length > 0 && (
                          <table className="data-table">
                            <thead>
                              <tr>
                                <th>Medication</th>
                                <th>Dosage</th>
                                <th>Qty</th>
                                <th>Duration</th>
                                <th>Instructions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {rx.items.map((item, idx) => (
                                <tr key={idx}>
                                  <td>{item.medication?.name || 'Unknown'}</td>
                                  <td>{item.dosage || '-'}</td>
                                  <td>{item.quantity || '-'}</td>
                                  <td>{item.duration || '-'}</td>
                                  <td>{item.instructions || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                        {rx.notes && <p className="notes">Notes: {rx.notes}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Medication Reminder Modal */}
      {showReminderModal && (
        <div className="modal-overlay" onClick={() => setShowReminderModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🔔 Medication Reminders</h3>
              <button className="close-btn" onClick={() => setShowReminderModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              {reminderNotifications.length === 0 ? (
                <p className="empty-text">No medication reminders</p>
              ) : (
                <div className="reminders-list">
                  {reminderNotifications.map((reminder, idx) => (
                    <div key={idx} className="reminder-card">
                      <div className="reminder-header">
                        <strong>💊 {reminder.medication}</strong>
                        <span className="reminder-date">Prescribed: {formatDate(reminder.prescribedDate)}</span>
                      </div>
                      <div className="reminder-details">
                        <div className="reminder-item">
                          <span className="label">Dosage:</span>
                          <span>{reminder.dosage}</span>
                        </div>
                        <div className="reminder-item">
                          <span className="label">Duration:</span>
                          <span>{reminder.duration}</span>
                        </div>
                        <div className="reminder-item">
                          <span className="label">Instructions:</span>
                          <span>{reminder.instructions}</span>
                        </div>
                        {reminder.diagnosis && (
                          <div className="reminder-item">
                            <span className="label">For:</span>
                            <span>{reminder.diagnosis}</span>
                          </div>
                        )}
                      </div>
                      <div className="reminder-alarm">
                        <span className="alarm-icon">⏰</span>
                        <span>Take {reminder.dosage} - {reminder.instructions}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="reminder-info">
                <p>💡 <strong>Tip:</strong> Set reminders on your phone to take medications on time for better health outcomes.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
