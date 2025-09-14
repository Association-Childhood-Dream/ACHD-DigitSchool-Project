import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
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
            <Route path="/" element={<ProtectedRoute />}>
              <Route index element={<Dashboard />} />
              <Route path="grades" element={<GradeEntry />} />
              <Route path="reports" element={<ReportView />} />
            </Route>
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="loading">Chargement...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <div>
      <Navbar />
      <Routes>
        <Route index element={<Dashboard />} />
        <Route path="grades" element={<GradeEntry />} />
        <Route path="reports" element={<ReportView />} />
      </Routes>
    </div>
  )
}

function Navbar() {
  const { user, logout } = useAuth()
  const [currentPath, setCurrentPath] = useState(window.location.pathname)

  useEffect(() => {
    setCurrentPath(window.location.pathname)
  }, [window.location.pathname])

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
                window.history.pushState({}, '', '/')
                setCurrentPath('/')
                window.dispatchEvent(new PopStateEvent('popstate'))
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
                  window.history.pushState({}, '', '/grades')
                  setCurrentPath('/grades')
                  window.dispatchEvent(new PopStateEvent('popstate'))
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
                  window.history.pushState({}, '', '/reports')
                  setCurrentPath('/reports')
                  window.dispatchEvent(new PopStateEvent('popstate'))
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
