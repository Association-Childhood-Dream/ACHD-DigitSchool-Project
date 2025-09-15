import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import GradeEntry from './components/GradeEntry'
import ReportView from './components/ReportView'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import './index.css'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute />} />
            <Route path="/grades" element={<ProtectedRoute />} />
            <Route path="/reports" element={<ProtectedRoute />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

function ProtectedRoute() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  if (loading) {
    return <div className="loading">Chargement...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Déterminer quelle page afficher selon l'URL
  const currentPath = window.location.pathname
  
  let content
  if (currentPath === '/grades') {
    content = <GradeEntry />
  } else if (currentPath === '/reports') {
    content = <ReportView />
  } else {
    content = <Dashboard />
  }

  return (
    <div>
      <Navbar />
      {content}
    </div>
  )
}

function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [currentPath, setCurrentPath] = useState(window.location.pathname)

  useEffect(() => {
    setCurrentPath(window.location.pathname)
  }, [window.location.pathname])

  const handleNavigation = (path) => {
    navigate(path)
    setCurrentPath(path)
  }

  return (
    <nav className="navbar">
      <div className="container">
        <h1>DigitSchool</h1>
        <ul className="navbar-nav">
          <li>
            <a 
              href="/" 
              className={currentPath === '/' ? 'active' : ''}
              onClick={(e) => {
                e.preventDefault()
                handleNavigation('/')
              }}
            >
              Dashboard
            </a>
          </li>
          {user?.role === 'teacher' && (
            <li>
              <a 
                href="/grades" 
                className={currentPath === '/grades' ? 'active' : ''}
                onClick={(e) => {
                  e.preventDefault()
                  handleNavigation('/grades')
                }}
              >
                Saisie des notes
              </a>
            </li>
          )}
          {(user?.role === 'student' || user?.role === 'parent') && (
            <li>
              <a 
                href="/reports" 
                className={currentPath === '/reports' ? 'active' : ''}
                onClick={(e) => {
                  e.preventDefault()
                  handleNavigation('/reports')
                }}
              >
                Mes bulletins
              </a>
            </li>
          )}
          <li>
            <button className="btn btn-secondary" onClick={logout}>
              Déconnexion
            </button>
          </li>
        </ul>
      </div>
    </nav>
  )
}

export default App
