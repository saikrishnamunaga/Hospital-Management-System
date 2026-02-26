import React, { useState } from 'react'
import api, { setAuthToken } from '../api'

export default function PatientLogin({ onAuth, onSwitchToAdmin, onSwitchToDoctor }) {
  const [patientId, setPatientId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      // Patients login with their patient ID (username)
      const res = await api.post('/auth/token/', { username: patientId, password })
      const access = res.data.access
      const refresh = res.data.refresh
      setAuthToken(access)
      localStorage.setItem('refresh', refresh)
      localStorage.setItem('userRole', 'patient')
      onAuth(access, 'patient')
    } catch (err) {
      console.error('Patient login error:', err)
      
      // Properly extract error message from API response
      let errorMessage = 'Invalid patient ID or password'
      
      if (err && typeof err === 'object') {
        if (err.detail) {
          errorMessage = err.detail
        } else if (err.non_field_errors) {
          errorMessage = Array.isArray(err.non_field_errors) 
            ? err.non_field_errors[0] 
            : err.non_field_errors
        } else if (err.message && !err.message.includes('JSON')) {
          errorMessage = 'Cannot connect to server. Please ensure the backend is running.'
        }
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container patient">
      <div className="login-box patient-login">
        <div className="login-header">
          <div className="logo">
            <span className="logo-icon">👤</span>
          </div>
          <h1>Patient Portal</h1>
          <p>Sign in to your patient account</p>
        </div>
        <form onSubmit={submit}>
          {error && <div className="error-message">{error}</div>}
          <div className="form-group">
            <label htmlFor="patientId">Patient ID</label>
            <input
              id="patientId"
              type="text"
              placeholder="Enter your patient ID"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary patient-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Patient Login'}
          </button>
        </form>
        <div className="login-footer">
          <div className="role-switch">
            <button onClick={onSwitchToAdmin} className="link-btn">Admin Login</button>
            <span className="divider">|</span>
            <button onClick={onSwitchToDoctor} className="link-btn">Doctor Login</button>
          </div>
        </div>
      </div>
    </div>
  )
}
