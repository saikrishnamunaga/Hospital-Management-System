import React, { useEffect, useState } from 'react'
import api from '../api'

export default function Doctors({ token, userRole }) {
  const [doctors, setDoctors] = useState([])
  const [specialties, setSpecialties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [doctorPatients, setDoctorPatients] = useState([])
  const [doctorAppointments, setDoctorAppointments] = useState([])
  const [showPatientModal, setShowPatientModal] = useState(false)
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false)
  const [showPatientDetailModal, setShowPatientDetailModal] = useState(false)
  const [selectedPatientDetail, setSelectedPatientDetail] = useState(null)
  const [patientPrescriptions, setPatientPrescriptions] = useState([])
  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    specialty: '',
    qualifications: '',
    experience_years: 0,
    bio: '',
    consultation_fee: 0,
  })

  // For editing patient symptoms and details
  const [patientEditData, setPatientEditData] = useState({
    current_symptoms: [],
    allergies: [],
    medical_history: [],
    emergency_warnings: [],
    lab_reports: []
  })
  const [newSymptom, setNewSymptom] = useState('')
  const [newAllergy, setNewAllergy] = useState('')
  const [newWarning, setNewWarning] = useState('')

  // For creating prescriptions
  const [prescriptionData, setPrescriptionData] = useState({
    appointment_id: '',
    diagnosis: '',
    notes: '',
    items: []
  })
  const [medications, setMedications] = useState([])
  const [availableAppointments, setAvailableAppointments] = useState([])

  useEffect(() => {
    fetchDoctors()
    fetchSpecialties()
    fetchMedications()
  }, [])

  const fetchDoctors = async () => {
    try {
      setLoading(true)
      const res = await api.get('/doctors/')
      setDoctors(res.data)
    } catch (err) {
      setError('Failed to load doctors')
    } finally {
      setLoading(false)
    }
  }

  const fetchSpecialties = async () => {
    try {
      const res = await api.get('/specialties/')
      setSpecialties(res.data)
    } catch (err) {
      console.error('Failed to load specialties')
    }
  }

  const fetchMedications = async () => {
    try {
      const res = await api.get('/medications/')
      setMedications(res.data)
    } catch (err) {
      console.error('Failed to load medications')
    }
  }

  const handleViewDoctor = async (doctor) => {
    setSelectedDoctor(doctor)
    try {
      const aptsRes = await api.get('/appointments/')
      const allAppointments = aptsRes.data.filter(a => a.doctor?.id === doctor.id)
      setDoctorAppointments(allAppointments)
      
      const patientsMap = new Map()
      allAppointments.forEach(apt => {
        if (apt.patient && !patientsMap.has(apt.patient.id)) {
          patientsMap.set(apt.patient.id, apt.patient)
        }
      })
      setDoctorPatients(Array.from(patientsMap.values()))
      setAvailableAppointments(allAppointments.filter(a => ['in-progress', 'booked', 'completed'].includes(a.status)))
      setShowPatientModal(true)
    } catch (err) {
      setError('Failed to load doctor details')
    }
  }

  const handleViewPatientDetail = async (patient) => {
    try {
      const patientRes = await api.get(`/patients/${patient.id}/`)
      const freshPatient = patientRes.data
      setSelectedPatientDetail(freshPatient)
      setPatientEditData({
        current_symptoms: freshPatient.current_symptoms || [],
        allergies: freshPatient.allergies || [],
        medical_history: freshPatient.medical_history || [],
        emergency_warnings: freshPatient.emergency_warnings || [],
        lab_reports: freshPatient.lab_reports || []
      })
      
      const aptsRes = await api.get('/appointments/')
      const patientApts = aptsRes.data.filter(a => a.patient?.id === patient.id)
      
      const rxRes = await api.get('/prescriptions/')
      const allRx = rxRes.data.filter(rx => {
        const apt = patientApts.find(a => a.id === rx.appointment_id)
        return apt !== undefined
      })
      setPatientPrescriptions(allRx)
      setShowPatientDetailModal(true)
    } catch (err) {
      setError('Failed to load patient details')
    }
  }

  const handleAddSymptom = () => {
    if (newSymptom.trim()) {
      setPatientEditData({
        ...patientEditData,
        current_symptoms: [...patientEditData.current_symptoms, newSymptom.trim()]
      })
      setNewSymptom('')
    }
  }

  const handleRemoveSymptom = (index) => {
    const newSymptoms = patientEditData.current_symptoms.filter((_, i) => i !== index)
    setPatientEditData({ ...patientEditData, current_symptoms: newSymptoms })
  }

  const handleAddAllergy = () => {
    if (newAllergy.trim()) {
      setPatientEditData({
        ...patientEditData,
        allergies: [...patientEditData.allergies, newAllergy.trim()]
      })
      setNewAllergy('')
    }
  }

  const handleRemoveAllergy = (index) => {
    const newAllergies = patientEditData.allergies.filter((_, i) => i !== index)
    setPatientEditData({ ...patientEditData, allergies: newAllergies })
  }

  const handleAddWarning = () => {
    if (newWarning.trim()) {
      setPatientEditData({
        ...patientEditData,
        emergency_warnings: [...patientEditData.emergency_warnings, newWarning.trim()]
      })
      setNewWarning('')
    }
  }

  const handleRemoveWarning = (index) => {
    const newWarnings = patientEditData.emergency_warnings.filter((_, i) => i !== index)
    setPatientEditData({ ...patientEditData, emergency_warnings: newWarnings })
  }

  const handleSavePatientDetails = async () => {
    try {
      await api.patch(`/patients/${selectedPatientDetail.id}/`, patientEditData)
      alert('Patient details saved successfully!')
      handleViewPatientDetail(selectedPatientDetail)
    } catch (err) {
      setError('Failed to save patient details')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const userRes = await api.post('/auth/register/', {
        ...formData,
        role: 'doctor',
      })
      
      if (formData.specialty) {
        await api.patch(`/doctors/${userRes.data.id}/`, {
          specialty: formData.specialty,
          qualifications: formData.qualifications,
          experience_years: formData.experience_years,
          bio: formData.bio,
          consultation_fee: formData.consultation_fee,
          is_available: true,
        })
      }
      
      setShowModal(false)
      fetchDoctors()
      setFormData({
        username: '',
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        specialty: '',
        qualifications: '',
        experience_years: 0,
        bio: '',
        consultation_fee: 0,
      })
    } catch (err) {
      setError('Failed to create doctor')
    }
  }

  const handleAddMedicationToPrescription = (medication) => {
    const newItem = {
      medication_id: medication.id,
      medication: medication,
      dosage: medication.dosage || '',
      quantity: 1,
      duration: '7 days',
      instructions: 'As directed'
    }
    setPrescriptionData({
      ...prescriptionData,
      items: [...prescriptionData.items, newItem]
    })
  }

  const handleRemoveMedication = (index) => {
    const newItems = prescriptionData.items.filter((_, i) => i !== index)
    setPrescriptionData({ ...prescriptionData, items: newItems })
  }

  const handleItemChange = (index, field, value) => {
    const newItems = [...prescriptionData.items]
    newItems[index][field] = value
    setPrescriptionData({ ...prescriptionData, items: newItems })
  }

  const handleCreatePrescription = async (e) => {
    e.preventDefault()
    try {
      const prescriptionPayload = {
        appointment_id: parseInt(prescriptionData.appointment_id),
        diagnosis: prescriptionData.diagnosis,
        notes: prescriptionData.notes,
        items: prescriptionData.items.map(item => ({
          medication_id: item.medication_id,
          dosage: item.dosage,
          quantity: item.quantity,
          duration: item.duration,
          instructions: item.instructions
        }))
      }
      await api.post('/prescriptions/', prescriptionPayload)
      setShowPrescriptionModal(false)
      setPrescriptionData({
        appointment_id: '',
        diagnosis: '',
        notes: '',
        items: []
      })
      alert('Prescription created successfully!')
    } catch (err) {
      setError('Failed to create prescription: ' + (err.response?.data?.detail || err.message))
    }
  }

  const filteredDoctors = doctors.filter(doc => {
    const fullName = `${doc.user?.first_name || ''} ${doc.user?.last_name || ''}`.toLowerCase()
    return fullName.includes(searchTerm.toLowerCase()) || 
           (doc.specialty_name && doc.specialty_name.toLowerCase().includes(searchTerm.toLowerCase()))
  })

  const formatFee = (cents) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format((cents || 0) / 100)
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

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
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

  if (loading) return <div className="loading">Loading doctors...</div>
  if (error) return <div className="error-message">{error}</div>

  return (
    <div className="card">
      <div className="card-header">
        <h2>👨‍⚕️ Doctors</h2>
        <div className="header-actions">
          <input
            type="text"
            placeholder="Search doctors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {userRole === 'admin' && (
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              + Add Doctor
            </button>
          )}
        </div>
      </div>
      
      <div className="filter-bar">
        <label>Filter by Specialty:</label>
        <select onChange={(e) => setSearchTerm(e.target.value)} value={searchTerm}>
          <option value="">All Specialties</option>
          {specialties.map(spec => (
            <option key={spec.id} value={spec.name}>{spec.icon} {spec.name}</option>
          ))}
        </select>
      </div>

      {filteredDoctors.length === 0 ? (
        <p className="empty-state">No doctors found</p>
      ) : (
        <div className="doctors-grid">
          {filteredDoctors.map((doc) => (
            <div key={doc.id} className="doctor-card" onClick={() => handleViewDoctor(doc)} style={{cursor: 'pointer'}}>
              <div className="doctor-avatar">
                {doc.user?.first_name?.[0] || 'D'}{doc.user?.last_name?.[0] || 'r'}
              </div>
              <div className="doctor-info">
                <h3>Dr. {doc.user?.first_name} {doc.user?.last_name}</h3>
                <p className="specialty">
                  {doc.specialty_name ? `🏥 ${doc.specialty_name}` : '🏥 General Medicine'}
                </p>
                <p className="qualifications">{doc.qualifications || 'No qualifications listed'}</p>
                {doc.experience_years > 0 && (
                  <p className="experience">✨ {doc.experience_years} years experience</p>
                )}
                {doc.consultation_fee > 0 && (
                  <p className="fee">💰 Consultation: {formatFee(doc.consultation_fee)}</p>
                )}
                {doc.is_available && <span className="available-badge">Available</span>}
                <p className="view-details">Click to view patients & appointments</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Doctor</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Specialty</label>
                <select
                  value={formData.specialty}
                  onChange={(e) => setFormData({...formData, specialty: e.target.value})}
                >
                  <option value="">Select Specialty</option>
                  {specialties.map(spec => (
                    <option key={spec.id} value={spec.id}>{spec.icon} {spec.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Qualifications</label>
                <input
                  type="text"
                  value={formData.qualifications}
                  onChange={(e) => setFormData({...formData, qualifications: e.target.value})}
                  placeholder="e.g., MBBS, MD"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Experience (Years)</label>
                  <input
                    type="number"
                    value={formData.experience_years}
                    onChange={(e) => setFormData({...formData, experience_years: parseInt(e.target.value)})}
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Consultation Fee (₹)</label>
                  <input
                    type="number"
                    value={formData.consultation_fee / 100}
                    onChange={(e) => setFormData({...formData, consultation_fee: parseFloat(e.target.value) * 100})}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  rows="3"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">Add Doctor</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPatientModal && selectedDoctor && (
        <div className="modal-overlay" onClick={() => setShowPatientModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Dr. {selectedDoctor.user?.first_name} {selectedDoctor.user?.last_name} - Patient List</h3>
              <button className="close-btn" onClick={() => setShowPatientModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="quick-actions">
                <button 
                  className="btn-primary" 
                  onClick={() => {
                    setShowPatientModal(false)
                    setShowPrescriptionModal(true)
                  }}
                  disabled={availableAppointments.length === 0}
                >
                  + New Prescription
                </button>
              </div>

              <div className="section">
                <h4>👥 Patients ({doctorPatients.length})</h4>
                {doctorPatients.length === 0 ? (
                  <p className="empty-text">No patients yet</p>
                ) : (
                  <div className="patients-list">
                    {doctorPatients.map(patient => (
                      <div key={patient.id} className="patient-mini-card">
                        <div className="patient-avatar">
                          {patient.user?.first_name?.[0]}{patient.user?.last_name?.[0]}
                        </div>
                        <div className="patient-info">
                          <strong>{patient.user?.first_name} {patient.user?.last_name}</strong>
                          <span>📱 {patient.phone || 'No phone'}</span>
                          <span>🩸 {patient.blood_group || 'N/A'}</span>
                        </div>
                        <button 
                          className="btn-sm btn-secondary"
                          onClick={() => handleViewPatientDetail(patient)}
                        >
                          View Details & Edit
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="section">
                <h4>📅 Appointments ({doctorAppointments.length})</h4>
                {doctorAppointments.length === 0 ? (
                  <p className="empty-text">No appointments</p>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Patient</th>
                        <th>Date & Time</th>
                        <th>Reason</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {doctorAppointments.map(apt => (
                        <tr key={apt.id}>
                          <td>{apt.patient?.user?.first_name} {apt.patient?.user?.last_name}</td>
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
            </div>
          </div>
        </div>
      )}

      {showPatientDetailModal && selectedPatientDetail && (
        <div className="modal-overlay" onClick={() => setShowPatientDetailModal(false)}>
          <div className="modal modal-xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Patient Details: {selectedPatientDetail.user?.first_name} {selectedPatientDetail.user?.last_name}</h3>
              <button className="close-btn" onClick={() => setShowPatientDetailModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="patient-details-section">
                <h4>📋 Personal Information</h4>
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="label">Name:</span>
                    <span className="value">{selectedPatientDetail.user?.first_name} {selectedPatientDetail.user?.last_name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Email:</span>
                    <span className="value">{selectedPatientDetail.user?.email || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Phone:</span>
                    <span className="value">{selectedPatientDetail.phone || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Date of Birth:</span>
                    <span className="value">{formatDate(selectedPatientDetail.date_of_birth)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Gender:</span>
                    <span className="value">{selectedPatientDetail.gender || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Blood Group:</span>
                    <span className="value">{selectedPatientDetail.blood_group || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Emergency Contact:</span>
                    <span className="value">{selectedPatientDetail.emergency_contact || '-'}</span>
                  </div>
                  <div className="detail-item full-width">
                    <span className="label">Address:</span>
                    <span className="value">{selectedPatientDetail.address || '-'}</span>
                  </div>
                </div>
              </div>

              <div className="patient-details-section">
                <h4>🤒 Current Symptoms</h4>
                <div className="tag-input-group">
                  <input
                    type="text"
                    placeholder="Add symptom..."
                    value={newSymptom}
                    onChange={(e) => setNewSymptom(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSymptom())}
                  />
                  <button type="button" className="btn-sm btn-primary" onClick={handleAddSymptom}>Add</button>
                </div>
                <div className="tags-list">
                  {patientEditData.current_symptoms.map((symptom, idx) => (
                    <span key={idx} className="tag warning">
                      {symptom}
                      <button type="button" onClick={() => handleRemoveSymptom(idx)}>×</button>
                    </span>
                  ))}
                  {patientEditData.current_symptoms.length === 0 && <p className="empty-text">No symptoms recorded</p>}
                </div>
              </div>

              <div className="patient-details-section">
                <h4>⚠️ Allergies</h4>
                <div className="tag-input-group">
                  <input
                    type="text"
                    placeholder="Add allergy..."
                    value={newAllergy}
                    onChange={(e) => setNewAllergy(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAllergy())}
                  />
                  <button type="button" className="btn-sm btn-primary" onClick={handleAddAllergy}>Add</button>
                </div>
                <div className="tags-list">
                  {patientEditData.allergies.map((allergy, idx) => (
                    <span key={idx} className="tag danger">
                      {allergy}
                      <button type="button" onClick={() => handleRemoveAllergy(idx)}>×</button>
                    </span>
                  ))}
                  {patientEditData.allergies.length === 0 && <p className="empty-text">No allergies recorded</p>}
                </div>
              </div>

              <div className="patient-details-section">
                <h4>🚨 Emergency Warnings</h4>
                <div className="tag-input-group">
                  <input
                    type="text"
                    placeholder="Add emergency warning..."
                    value={newWarning}
                    onChange={(e) => setNewWarning(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddWarning())}
                  />
                  <button type="button" className="btn-sm btn-primary" onClick={handleAddWarning}>Add</button>
                </div>
                <div className="tags-list">
                  {patientEditData.emergency_warnings.map((warning, idx) => (
                    <span key={idx} className="tag danger">
                      {warning}
                      <button type="button" onClick={() => handleRemoveWarning(idx)}>×</button>
                    </span>
                  ))}
                  {patientEditData.emergency_warnings.length === 0 && <p className="empty-text">No emergency warnings</p>}
                </div>
              </div>

              <div className="patient-details-section">
                <h4>📜 Medical History</h4>
                <div className="tags-list">
                  {(patientEditData.medical_history || []).map((history, idx) => (
                    <span key={idx} className="tag">{history}</span>
                  ))}
                  {(patientEditData.medical_history || []).length === 0 && <p className="empty-text">No medical history</p>}
                </div>
              </div>

              <div className="patient-details-section">
                <h4>💊 Prescription History</h4>
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

              <div className="modal-actions" style={{ marginTop: '20px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowPatientDetailModal(false)}>
                  Close
                </button>
                <button type="button" className="btn-primary" onClick={handleSavePatientDetails}>
                  Save Patient Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPrescriptionModal && (
        <div className="modal-overlay" onClick={() => setShowPrescriptionModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Prescription</h3>
              <button className="close-btn" onClick={() => setShowPrescriptionModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreatePrescription}>
              <div className="form-group">
                <label>Appointment (Patient)</label>
                <select
                  value={prescriptionData.appointment_id}
                  onChange={(e) => setPrescriptionData({...prescriptionData, appointment_id: e.target.value ? parseInt(e.target.value) : ''})}
                  required
                >
                  <option value="">Select Appointment</option>
                  {availableAppointments.map(apt => (
                    <option key={apt.id} value={apt.id}>
                      {apt.patient?.user?.first_name} {apt.patient?.user?.last_name} - {formatDateTime(apt.scheduled_time)} ({apt.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Diagnosis</label>
                <textarea
                  value={prescriptionData.diagnosis}
                  onChange={(e) => setPrescriptionData({...prescriptionData, diagnosis: e.target.value})}
                  placeholder="Enter diagnosis"
                  rows="2"
                />
              </div>

              <div className="form-group">
                <label>Medications</label>
                <select
                  onChange={(e) => {
                    const med = medications.find(m => m.id === parseInt(e.target.value))
                    if (med) handleAddMedicationToPrescription(med)
                    e.target.value = ''
                  }}
                >
                  <option value="">+ Add Medication</option>
                  {medications.filter(m => !prescriptionData.items.some(item => item.medication_id === m.id)).map(med => (
                    <option key={med.id} value={med.id}>
                      {med.name} - {med.dosage} ({med.category})
                    </option>
                  ))}
                </select>

                {prescriptionData.items.length > 0 && (
                  <div className="prescription-items">
                    {prescriptionData.items.map((item, index) => (
                      <div key={index} className="prescription-item-row">
                        <div className="item-info">
                          <strong>{item.medication?.name}</strong>
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
                  value={prescriptionData.notes}
                  onChange={(e) => setPrescriptionData({...prescriptionData, notes: e.target.value})}
                  placeholder="Additional notes"
                  rows="3"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowPrescriptionModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={prescriptionData.items.length === 0}>
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
