import React, { useState } from 'react'
import api from '../api'

export default function Register({ onSwitch }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    role: 'patient',
    // Patient specific fields
    date_of_birth: '',
    gender: '',
    phone: '',
    address: '',
    blood_group: '',
    emergency_contact: '',
  })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    
    // Prepare user data
    const userData = {
      username: formData.username,
      email: formData.email,
      password: formData.password,
      first_name: formData.first_name,
      last_name: formData.last_name,
      role: formData.role,
    }

    try {
      // Create user
      const userRes = await api.post('/auth/register/', userData)
      
      // If patient, update patient profile with additional details
      if (formData.role === 'patient') {
        const patientData = {}
        if (formData.date_of_birth) patientData.date_of_birth = formData.date_of_birth
        if (formData.gender) patientData.gender = formData.gender
        if (formData.phone) patientData.phone = formData.phone
        if (formData.address) patientData.address = formData.address
        if (formData.blood_group) patientData.blood_group = formData.blood_group
        if (formData.emergency_contact) patientData.emergency_contact = formData.emergency_contact
        
        if (Object.keys(patientData).length > 0) {
          await api.patch(`/patients/${userRes.data.id}/`, patientData)
        }
      }
      
      alert('Registration successful! Please login.')
      onSwitch()
    } catch (err) {
      console.error('Registration error:', err)
      
      // err is the plain data object returned from our api.js
      let errorMsg = 'Registration failed. Please try again.'
      
      if (err && typeof err === 'object') {
        // Check for specific field errors
        if (err.username) {
          if (Array.isArray(err.username)) {
            errorMsg = err.username[0]
          } else {
            errorMsg = err.username
          }
        } else if (err.email) {
          if (Array.isArray(err.email)) {
            errorMsg = err.email[0]
          } else {
            errorMsg = err.email
          }
        } else if (err.password) {
          if (Array.isArray(err.password)) {
            errorMsg = err.password[0]
          } else {
            errorMsg = err.password
          }
        } else if (err.detail) {
          errorMsg = err.detail
        } else if (err.non_field_errors) {
          if (Array.isArray(err.non_field_errors)) {
            errorMsg = err.non_field_errors[0]
          } else {
            errorMsg = err.non_field_errors
          }
        }
      }
      
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container register">
      <div className="login-card">
        <div className="login-header">
          <div className="logo">
            <span className="logo-icon">🏥</span>
          </div>
          <h1>Create Account</h1>
          <p>Sign up for Hospital Management System</p>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-row">
            <div className="form-group">
              <label>First Name</label>
              <input
                name="first_name"
                type="text"
                value={formData.first_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Last Name</label>
              <input
                name="last_name"
                type="text"
                value={formData.last_name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Username</label>
            <input
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          {/* Patient-specific fields */}
          <div className="form-row">
            <div className="form-group">
              <label>Date of Birth</label>
              <input
                name="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <input
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1 234 567 8900"
            />
          </div>

          <div className="form-group">
            <label>Address</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows="2"
              placeholder="Street, City, State, ZIP"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Blood Group</label>
              <select
                name="blood_group"
                value={formData.blood_group}
                onChange={handleChange}
              >
                <option value="">Select</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            <div className="form-group">
              <label>Emergency Contact</label>
              <input
                name="emergency_contact"
                type="tel"
                value={formData.emergency_contact}
                onChange={handleChange}
                placeholder="+1 234 567 8900"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="8"
            />
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        <p className="register-link">
          Already have an account? <button onClick={onSwitch}>Sign in</button>
        </p>
      </div>
    </div>
  )
}
