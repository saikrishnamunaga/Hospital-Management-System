import React, { useState } from 'react'
import api, { setAuthToken } from '../api'

export default function Login({ onAuth, onSwitchToRegister }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      // First, get the token
      const res = await api.post('/auth/token/', { username, password })
      const access = res.data.access
      const refresh = res.data.refresh
      
      // Set token before making the second API call
      setAuthToken(access)
      localStorage.setItem('refresh', refresh)
      
      // Fetch user info to get role
      const userRes = await api.get('/users/me/')
      const role = userRes.data.role || 'admin'
      
      onAuth(access, role)
    } catch (err) {
      console.error('Login error:', err)
      
      // Properly extract error message from API response
      let errorMessage = 'Invalid username or password'
      
      if (err && typeof err === 'object') {
        // Check for detail message (common in DRF)
        if (err.detail) {
          errorMessage = err.detail
        } 
        // Check for non_field_errors
        else if (err.non_field_errors) {
          errorMessage = Array.isArray(err.non_field_errors) 
            ? err.non_field_errors[0] 
            : err.non_field_errors
        }
        // Check for specific field errors
        else if (err.username) {
          errorMessage = Array.isArray(err.username) ? err.username[0] : err.username
        }
        else if (err.password) {
          errorMessage = Array.isArray(err.password) ? err.password[0] : err.password
        }
        // Fallback for network errors
        else if (err.message && !err.message.includes('JSON')) {
          // This might be a network error or server not running
          errorMessage = 'Cannot connect to server. Please ensure the backend is running.'
        }
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container admin">
      <div className="login-box">
        <div className="login-header">
          <div className="logo">
            <span className="logo-icon">🏥</span>
          </div>
          <h1>Hospital Management System</h1>
          <p>Sign in to your account</p>
        </div>
        <form onSubmit={submit}>
          {error && <div className="error-message">{error}</div>}
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div className="login-footer">
          <p>Don't have an account? <button onClick={onSwitchToRegister} className="link-btn">Register here</button></p>
        </div>
      </div>
    </div>
  )
}
