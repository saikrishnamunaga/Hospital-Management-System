import React, { useState } from 'react'
import Login from './components/Login'
import Register from './components/Register'
import DoctorLogin from './components/DoctorLogin'
import PatientLogin from './components/PatientLogin'
import Doctors from './components/Doctors'
import Appointments from './components/Appointments'
import Patients from './components/Patients'
import Prescriptions from './components/Prescriptions'
import Invoices from './components/Invoices'
import Dashboard from './components/Dashboard'
import Chatbot from './components/Chatbot'
import Logo, { LogoWithText } from './components/Logo'

export default function App(){
  const [token, setToken] = useState(localStorage.getItem('access') || null)
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || null)
  const [view, setView] = useState('dashboard')
  const [showRegister, setShowRegister] = useState(false)
  const [loginType, setLoginType] = useState('admin') // 'admin', 'doctor', 'patient'
  const [showChatbot, setShowChatbot] = useState(false)

  const handleLogout = () => {
    localStorage.clear()
    setToken(null)
    setUserRole(null)
    setView('dashboard')
    setShowChatbot(false)
  }

  const handleAuth = (t, role) => {
    localStorage.setItem('access', t)
    if (role) {
      localStorage.setItem('userRole', role)
      setUserRole(role)
    } else {
      // Try to get role from localStorage
      const storedRole = localStorage.getItem('userRole')
      if (storedRole) {
        setUserRole(storedRole)
      }
    }
    setToken(t)
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'doctors', label: 'Doctors', icon: '👨‍⚕️' },
    { id: 'patients', label: 'Patients', icon: '👤' },
    { id: 'appointments', label: 'Appointments', icon: '📅' },
    { id: 'prescriptions', label: 'Prescriptions', icon: '💊' },
    { id: 'invoices', label: 'Invoices', icon: '💰' },
  ]

  const renderView = () => {
    switch(view) {
      case 'doctors':
        return <Doctors token={token} userRole={userRole} />
      case 'patients':
        return <Patients token={token} userRole={userRole} />
      case 'appointments':
        return <Appointments token={token} userRole={userRole} />
      case 'prescriptions':
        return <Prescriptions token={token} userRole={userRole} />
      case 'invoices':
        return <Invoices token={token} userRole={userRole} />
      case 'dashboard':
      default:
        return <Dashboard token={token} userRole={userRole} onNavigate={setView} />
    }
  }

  const renderLogin = () => {
    switch(loginType) {
      case 'doctor':
        return (
          <DoctorLogin 
            onAuth={handleAuth} 
            onSwitchToAdmin={() => setLoginType('admin')}
            onSwitchToPatient={() => setLoginType('patient')}
          />
        )
      case 'patient':
        return (
          <PatientLogin 
            onAuth={handleAuth}
            onSwitchToAdmin={() => setLoginType('admin')}
            onSwitchToDoctor={() => setLoginType('doctor')}
          />
        )
      case 'admin':
      default:
        return (
          <Login 
            onAuth={(t, role) => handleAuth(t, role || 'admin')} 
            onSwitchToRegister={() => setShowRegister(true)}
          />
        )
    }
  }

  if (!token) {
    return (
      <div className="login-container">
        <div className="login-box">
          <div className="login-header">
            <div className="logo">
              <Logo size="large" />
            </div>
            <h1>Hospital Management System</h1>
            <p>Sign in to your account</p>
          </div>
          
          {/* Role Selection Tabs */}
          <div className="role-tabs">
            <button 
              className={`role-tab ${loginType === 'admin' ? 'active' : ''}`}
              onClick={() => setLoginType('admin')}
            >
              Admin
            </button>
            <button 
              className={`role-tab ${loginType === 'doctor' ? 'active' : ''}`}
              onClick={() => setLoginType('doctor')}
            >
              Doctor
            </button>
            <button 
              className={`role-tab ${loginType === 'patient' ? 'active' : ''}`}
              onClick={() => setLoginType('patient')}
            >
              Patient
            </button>
          </div>
          
          {showRegister ? (
            <Register onSwitch={() => setShowRegister(false)} />
          ) : (
            renderLogin()
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <LogoWithText size="medium" />
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <div className="sidebar-nav-section">
            <div className="sidebar-nav-section-title">Main Menu</div>
            {menuItems.map(item => (
              <button
                key={item.id}
                className={`nav-item ${view === item.id ? 'active' : ''}`}
                onClick={() => setView(item.id)}
              >
                <span className="nav-item-icon">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
        
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-wrapper">
        <header className="app-header">
          <div className="header-left">
            <h1 className="page-title">
              {menuItems.find(item => item.id === view)?.label || 'Dashboard'}
            </h1>
          </div>
          <div className="header-right">
            <div className="user-menu">
              <div className="user-avatar">
                {userRole?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="user-info">
                <span className="user-name">User</span>
                <span className="user-role">{userRole}</span>
              </div>
            </div>
            <button 
              className={`btn-chatbot ${showChatbot ? 'active' : ''}`}
              onClick={() => setShowChatbot(!showChatbot)}
              title="Health Assistant"
            >
              💬
            </button>
          </div>
        </header>
        
        <main className="app-main">
          {renderView()}
        </main>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <nav className="mobile-nav">
        {menuItems.map(item => (
          <button
            key={item.id}
            className={`mobile-nav-btn ${view === item.id ? 'active' : ''}`}
            onClick={() => setView(item.id)}
          >
            <span className="mobile-nav-icon">{item.icon}</span>
            <span className="mobile-nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
      
      {showChatbot && (
        <div className="chatbot-overlay" onClick={() => setShowChatbot(false)}>
          <div className="chatbot-wrapper" onClick={e => e.stopPropagation()}>
            <Chatbot token={token} />
            <button className="chatbot-close" onClick={() => setShowChatbot(false)}>✕</button>
          </div>
        </div>
      )}
    </div>
  )
}
