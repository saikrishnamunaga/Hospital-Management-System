import React, { useEffect, useState } from 'react'
import api from '../api'

export default function Prescriptions({ token }) {
  const [prescriptions, setPrescriptions] = useState([])
  const [appointments, setAppointments] = useState([])
  const [medications, setMedications] = useState([])
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [formData, setFormData] = useState({
    appointment_id: '',
    diagnosis: '',
    notes: '',
    items: []
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [prescriptionsRes, appointmentsRes, medicationsRes, patientsRes] = await Promise.all([
        api.get('/prescriptions/'),
        api.get('/appointments/'),
        api.get('/medications/'),
        api.get('/patients/')
      ])
      setPrescriptions(prescriptionsRes.data)
// Show in-progress and booked appointments for prescriptions
      setAppointments(appointmentsRes.data.filter(a => a.status === 'in-progress' || a.status === 'booked'))
      setMedications(medicationsRes.data.filter(m => m.in_stock))
      setPatients(patientsRes.data)
    } catch (err) {
      setError('Failed to load prescriptions')
    } finally {
      setLoading(false)
    }
  }

  const handleAppointmentChange = (appointmentId) => {
    const appointment = appointments.find(a => a.id === parseInt(appointmentId))
    setSelectedAppointment(appointment)
    setFormData({ ...formData, appointment_id: parseInt(appointmentId), items: [] })
  }

  const handleAddMedication = (medication) => {
    const newItem = {
      medication_id: medication.id,
      medication: medication,
      dosage: medication.dosage,
      quantity: 1,
      duration: '7 days',
      instructions: 'As directed'
    }
    setFormData({
      ...formData,
      items: [...formData.items, newItem]
    })
  }

  const handleRemoveMedication = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index)
    setFormData({ ...formData, items: newItems })
  }

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items]
    newItems[index][field] = value
    setFormData({ ...formData, items: newItems })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // Prepare prescription data
      const prescriptionData = {
        appointment_id: formData.appointment_id,
        diagnosis: formData.diagnosis,
        notes: formData.notes,
        items: formData.items.map(item => ({
          medication_id: item.medication_id,
          dosage: item.dosage,
          quantity: item.quantity,
          duration: item.duration,
          instructions: item.instructions
        }))
      }
      await api.post('/prescriptions/', prescriptionData)
      setShowModal(false)
      setFormData({
        appointment_id: '',
        diagnosis: '',
        notes: '',
        items: []
      })
      setSelectedAppointment(null)
      fetchData()
    } catch (err) {
      setError('Failed to create prescription: ' + (err.response?.data?.detail || err.message))
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this prescription?')) return
    try {
      await api.delete(`/prescriptions/${id}/`)
      fetchData()
    } catch (err) {
      setError('Failed to delete prescription')
    }
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatPrice = (cents) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format((cents || 0) / 100)
  }

  const getPatientInfo = (patientId) => {
    return patients.find(p => p.id === patientId)
  }

  const getMedicationSuggestions = () => {
    return medications.filter(m => 
      !formData.items.some(item => item.medication_id === m.id)
    )
  }

  if (loading) return <div className="loading">Loading prescriptions...</div>

  return (
    <div className="card">
      <div className="card-header">
        <h2>Prescriptions</h2>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + New Prescription
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {prescriptions.length === 0 ? (
        <p className="empty-state">No prescriptions found</p>
      ) : (
        <div className="prescriptions-list">
          {prescriptions.map((prescription) => {
            const appointment = appointments.find(a => a.id === prescription.appointment_id)
            return (
              <div key={prescription.id} className="prescription-card">
                <div className="prescription-header">
                  <span className="prescription-date">
                    {formatDate(prescription.prescribed_at)}
                  </span>
                  <button 
                    className="btn-danger btn-sm"
                    onClick={() => handleDelete(prescription.id)}
                  >
                    Delete
                  </button>
                </div>
                <div className="prescription-body">
                  {prescription.diagnosis && (
                    <div className="prescription-section">
                      <h4>Diagnosis:</h4>
                      <p>{prescription.diagnosis}</p>
                    </div>
                  )}
                  <div className="prescription-section">
                    <h4>Medications:</h4>
                    {prescription.items && prescription.items.length > 0 ? (
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
                          {prescription.items.map((item, idx) => (
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
                    ) : (
                      <p className="empty-text">No medications listed</p>
                    )}
                  </div>
                  {prescription.notes && (
                    <div className="prescription-section">
                      <h4>Notes:</h4>
                      <p>{prescription.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <div className="modal-header">
              <h3>New Prescription</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Appointment (Patient)</label>
                <select
                  value={formData.appointment_id}
                  onChange={(e) => handleAppointmentChange(e.target.value)}
                  required
                >
                  <option value="">Select Appointment</option>
                  {appointments.map(apt => (
                    <option key={apt.id} value={apt.id}>
                      {apt.patient?.user?.first_name} {apt.patient?.user?.last_name} - Dr. {apt.doctor?.user?.first_name} - {formatDate(apt.scheduled_time)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Patient Profile Information */}
              {selectedAppointment && selectedAppointment.patient && (
                <div className="patient-info-card">
                  <h4>Patient Information</h4>
                  <div className="patient-details">
                    <div className="detail-row">
                      <span className="label">Name:</span>
                      <span>{selectedAppointment.patient.user?.first_name} {selectedAppointment.patient.user?.last_name}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Gender:</span>
                      <span>{selectedAppointment.patient.gender || 'N/A'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Blood Group:</span>
                      <span>{selectedAppointment.patient.blood_group || 'N/A'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Phone:</span>
                      <span>{selectedAppointment.patient.phone || 'N/A'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Emergency Contact:</span>
                      <span>{selectedAppointment.patient.emergency_contact || 'N/A'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Address:</span>
                      <span>{selectedAppointment.patient.address || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Diagnosis</label>
                <textarea
                  value={formData.diagnosis}
                  onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
                  placeholder="Enter diagnosis"
                  rows="2"
                />
              </div>

              <div className="form-group">
                <label>Medications (Select from list)</label>
                <select
                  onChange={(e) => {
                    const med = medications.find(m => m.id === parseInt(e.target.value))
                    if (med) handleAddMedication(med)
                    e.target.value = ''
                  }}
                  className="medication-select"
                >
                  <option value="">+ Add Medication from Catalog</option>
                  {getMedicationSuggestions().map(med => (
                    <option key={med.id} value={med.id}>
                      {med.name} - {med.dosage} ({med.category}) - {formatPrice(med.price_cents)}
                    </option>
                  ))}
                </select>

                {formData.items.length > 0 && (
                  <div className="prescription-items">
                    <h5>Prescribed Medications:</h5>
                    {formData.items.map((item, index) => (
                      <div key={index} className="prescription-item-row">
                        <div className="item-info">
                          <strong>{item.medication?.name}</strong>
                          <span className="item-dosage">{item.dosage}</span>
                        </div>
                        <div className="item-fields">
                          <input
                            type="text"
                            placeholder="Dosage"
                            value={item.dosage}
                            onChange={(e) => handleItemChange(index, 'dosage', e.target.value)}
                          />
                          <input
                            type="number"
                            placeholder="Qty"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                            style={{ width: '60px' }}
                          />
                          <input
                            type="text"
                            placeholder="Duration"
                            value={item.duration}
                            onChange={(e) => handleItemChange(index, 'duration', e.target.value)}
                          />
                          <input
                            type="text"
                            placeholder="Instructions"
                            value={item.instructions}
                            onChange={(e) => handleItemChange(index, 'instructions', e.target.value)}
                          />
                        </div>
                        <button
                          type="button"
                          className="remove-btn"
                          onClick={() => handleRemoveMedication(index)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Additional notes for the patient"
                  rows="3"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={formData.items.length === 0}>
                  Create Prescription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
