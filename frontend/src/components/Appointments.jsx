import React, { useEffect, useState } from 'react'
import api from '../api'

export default function Appointments({ token }) {
  const [appointments, setAppointments] = useState([])
  const [doctors, setDoctors] = useState([])
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    doctor_id: '',
    patient_id: '',
    scheduled_time: '',
    reason: '',
    status: 'booked'
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [appointmentsRes, doctorsRes, patientsRes] = await Promise.all([
        api.get('/appointments/'),
        api.get('/doctors/'),
        api.get('/patients/')
      ])
      setAppointments(appointmentsRes.data)
      setDoctors(doctorsRes.data)
      setPatients(patientsRes.data)
    } catch (err) {
      setError('Failed to load appointments')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/appointments/', formData)
      setShowModal(false)
      setFormData({
        doctor_id: '',
        patient_id: '',
        scheduled_time: '',
        reason: '',
        status: 'booked'
      })
      fetchData()
    } catch (err) {
      setError('Failed to create appointment')
    }
  }

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.patch(`/appointments/${id}/`, { status: newStatus })
      fetchData()
    } catch (err) {
      setError('Failed to update appointment')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this appointment?')) return
    try {
      await api.delete(`/appointments/${id}/`)
      fetchData()
    } catch (err) {
      setError('Failed to delete appointment')
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

  const formatDateTime = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  if (loading) return <div className="loading">Loading appointments...</div>

  return (
    <div className="card">
      <div className="card-header">
        <h2>Appointments</h2>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + New Appointment
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {appointments.length === 0 ? (
        <p className="empty-state">No appointments found</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Doctor</th>
              <th>Patient</th>
              <th>Date & Time</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((apt) => (
              <tr key={apt.id}>
                <td>{apt.doctor?.user ? `Dr. ${apt.doctor.user.first_name} ${apt.doctor.user.last_name}` : 'N/A'}</td>
                <td>{apt.patient?.user ? `${apt.patient.user.first_name} ${apt.patient.user.last_name}` : 'N/A'}</td>
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
                <td>
                  <div className="action-buttons">
                    <select
                      value={apt.status}
                      onChange={(e) => handleStatusChange(apt.id, e.target.value)}
                      className="status-select"
                    >
                      <option value="booked">Booked</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="no-show">No-show</option>
                    </select>
                    <button 
                      className="btn-danger"
                      onClick={() => handleDelete(apt.id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>New Appointment</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Doctor</label>
                <select
                  value={formData.doctor_id}
                  onChange={(e) => setFormData({...formData, doctor_id: e.target.value ? parseInt(e.target.value) : ''})}
                  required
                >
                  <option value="">Select Doctor</option>
                  {doctors.map(doc => (
                    <option key={doc.id} value={doc.id}>
                      Dr. {doc.user.first_name} {doc.user.last_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Patient</label>
                <select
                  value={formData.patient_id}
                  onChange={(e) => setFormData({...formData, patient_id: e.target.value ? parseInt(e.target.value) : ''})}
                  required
                >
                  <option value="">Select Patient</option>
                  {patients.map(pat => (
                    <option key={pat.id} value={pat.id}>
                      {pat.user.first_name} {pat.user.last_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Date & Time</label>
                <input
                  type="datetime-local"
                  value={formData.scheduled_time}
                  onChange={(e) => setFormData({...formData, scheduled_time: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Reason</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  placeholder="Reason for appointment"
                  rows="3"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
