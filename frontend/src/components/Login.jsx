import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, user } = useAuth()

  // Rediriger si l'utilisateur est déjà connecté
  useEffect(() => {
    if (user) {
      window.location.href = '/pages'
    }
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await login(email, password)
    
    if (result.success) {
      // Redirection automatique après connexion réussie
      window.location.href = '/pages'
    } else {
      setError(result.error)
    }
    
    setLoading(false)
  }

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: '400px', margin: '50px auto' }}>
        <h2 className="text-center mb-3">Connexion DigitSchool</h2>
        
        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <input
              type="password"
              id="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn" 
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className="text-center mt-3">
          <small className="text-muted">
            Comptes de test disponibles :
            <br />
            Admin: admin@digitschool.com / admin123
            <br />
            Enseignant: teacher@digitschool.com / teacher123
            <br />
            Élève: student@digitschool.com / student123
          </small>
        </div>
      </div>
    </div>
  )
}

export default Login
