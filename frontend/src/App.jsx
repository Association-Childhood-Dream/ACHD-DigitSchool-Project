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
            <Route path="/pages" element={<ProtectedRoute />} />
            <Route path="/pages/grades" element={<ProtectedRoute />} />
            <Route path="/pages/reports" element={<ProtectedRoute />} />
            <Route path="/" element={<Navigate to="/pages" replace />} />
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
  if (currentPath === '/pages/grades') {
    content = <GradeEntry />
  } else if (currentPath === '/pages/reports') {
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
    const fullPath = path === '/' ? '/pages' : `/pages${path}`
    navigate(fullPath)
    setCurrentPath(fullPath)
  }

  return (
    <nav className="navbar">
      <div className="container">
        <h1>DigitSchool</h1>
        <ul className="navbar-nav">
          <li>
            <a 
              href="/pages" 
              className={currentPath === '/pages' ? 'active' : ''}
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
                href="/pages/grades" 
                className={currentPath === '/pages/grades' ? 'active' : ''}
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
                href="/pages/reports" 
                className={currentPath === '/pages/reports' ? 'active' : ''}
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
