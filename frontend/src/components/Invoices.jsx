import React, { useEffect, useState } from 'react'
import api from '../api'

export default function Invoices({ token }) {
  const [invoices, setInvoices] = useState([])
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState('all')
  const [formData, setFormData] = useState({
    appointment_id: '',
    amount_cents: '',
    currency: 'INR',
    status: 'pending'
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [invoicesRes, appointmentsRes] = await Promise.all([
        api.get('/invoices/'),
        api.get('/appointments/')
      ])
      setInvoices(invoicesRes.data)
      setAppointments(appointmentsRes.data)
    } catch (err) {
      setError('Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/invoices/', {
        ...formData,
        amount_cents: parseInt(formData.amount_cents)
      })
      setShowModal(false)
      setFormData({
        appointment_id: '',
        amount_cents: '',
        currency: 'INR',
        status: 'pending'
      })
      fetchData()
    } catch (err) {
      setError('Failed to create invoice')
    }
  }

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.patch(`/invoices/${id}/`, { status: newStatus })
      fetchData()
    } catch (err) {
      setError('Failed to update invoice')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return
    try {
      await api.delete(`/invoices/${id}/`)
      fetchData()
    } catch (err) {
      setError('Failed to delete invoice')
    }
  }

  const formatAmount = (cents, currency) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR'
    }).format((cents || 0) / 100)
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      paid: '#22c55e',
      failed: '#ef4444'
    }
    return colors[status] || '#6b7280'
  }

  const filteredInvoices = invoices.filter(inv => {
    if (filter === 'all') return true
    return inv.status === filter
  })

  const totalRevenue = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + (inv.amount_cents || 0), 0)

  const pendingAmount = invoices
    .filter(inv => inv.status === 'pending')
    .reduce((sum, inv) => sum + (inv.amount_cents || 0), 0)

  if (loading) return <div className="loading">Loading invoices...</div>

  return (
    <div className="card">
      <div className="card-header">
        <h2>Invoices</h2>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + Create Invoice
        </button>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-label">Total Revenue</span>
          <span className="stat-value success">{formatAmount(totalRevenue, 'INR')}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Pending</span>
          <span className="stat-value warning">{formatAmount(pendingAmount, 'INR')}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Invoices</span>
          <span className="stat-value">{invoices.length}</span>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="filter-bar">
        <label>Filter by status:</label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {filteredInvoices.length === 0 ? (
        <p className="empty-state">No invoices found</p>
      ) : (
<table className="data-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.map((invoice) => {
              const appointment = appointments.find(apt => apt.id === (invoice.appointment_id || invoice.appointment));
              const patientName = appointment?.patient?.user ? 
                `${appointment.patient.user.first_name} ${appointment.patient.user.last_name}` : 
                (invoice.patient ? `${invoice.patient.first_name} ${invoice.patient.last_name}` : 'N/A');
              const doctorName = appointment?.doctor?.user ? 
                `Dr. ${appointment.doctor.user.first_name} ${appointment.doctor.user.last_name}` : 'N/A';
              return (
                <tr key={invoice.id}>
                  <td>{patientName}</td>
                  <td>{doctorName}</td>
                  <td className="amount">{formatAmount(invoice.amount_cents, invoice.currency)}</td>
                  <td>
                    <span 
                      className="status-badge" 
                      style={{ backgroundColor: getStatusColor(invoice.status) }}
                    >
                      {invoice.status}
                    </span>
                  </td>
                  <td>{formatDate(invoice.issued_at)}</td>
                  <td>
                    <div className="action-buttons">
                      {invoice.status === 'pending' && (
                        <button 
                          className="btn-success btn-sm"
                          onClick={() => handleStatusChange(invoice.id, 'paid')}
                        >
                          Mark Paid
                        </button>
                      )}
                      <button 
                        className="btn-danger btn-sm"
                        onClick={() => handleDelete(invoice.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Create Invoice</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Appointment</label>
                <select
                  value={formData.appointment_id}
                  onChange={(e) => setFormData({...formData, appointment_id: e.target.value ? parseInt(e.target.value) : ''})}
                  required
                >
                  <option value="">Select Appointment</option>
                  {appointments.map(apt => (
                    <option key={apt.id} value={apt.id}>
                      {apt.patient?.user?.first_name || 'Patient'} {apt.patient?.user?.last_name || ''} - {formatDate(apt.scheduled_time)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Amount (in rupees)</label>
                <input
                  type="number"
                  value={formData.amount_cents}
                  onChange={(e) => setFormData({...formData, amount_cents: e.target.value})}
                  placeholder="Enter amount in rupees"
                  required
                />
                <small>Example: 1000 for ₹1000.00</small>
              </div>
              <div className="form-group">
                <label>Currency</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({...formData, currency: e.target.value})}
                >
                  <option value="INR">INR - Indian Rupee</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
