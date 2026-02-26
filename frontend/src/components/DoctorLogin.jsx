import React, { useState } from 'react'
import api, { setAuthToken } from '../api'

export default function DoctorLogin({ onAuth, onSwitchToAdmin, onSwitchToPatient }) {
  const [employeeId, setEmployeeId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      // Doctors login with their employee ID (username)
      const res = await api.post('/auth/token/', { username: employeeId, password })
      const access = res.data.access
      const refresh = res.data.refresh
      setAuthToken(access)
      localStorage.setItem('refresh', refresh)
      localStorage.setItem('userRole', 'doctor')
      onAuth(access, 'doctor')
    } catch (err) {
      console.error('Doctor login error:', err)
      
      // Properly extract error message from API response
      let errorMessage = 'Invalid employee ID or password'
      
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
    <div className="login-container doctor">
      <div className="login-box doctor-login">
        <div className="login-header">
          <div className="logo">
            <span className="logo-icon">👨‍⚕️</span>
          </div>
          <h1>Doctor Portal</h1>
          <p>Sign in to your doctor account</p>
        </div>
        <form onSubmit={submit}>
          {error && <div className="error-message">{error}</div>}
          <div className="form-group">
            <label htmlFor="employeeId">Employee ID</label>
            <input
              id="employeeId"
              type="text"
              placeholder="Enter your employee ID"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
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
          <button type="submit" className="btn-primary doctor-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Doctor Login'}
          </button>
        </form>
        <div className="login-footer">
          <div className="role-switch">
            <button onClick={onSwitchToAdmin} className="link-btn">Admin Login</button>
            <span className="divider">|</span>
            <button onClick={onSwitchToPatient} className="link-btn">Patient Login</button>
          </div>
        </div>
      </div>
    </div>
  )
}
