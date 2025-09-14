import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/api'

function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Charger les classes
      const classesResponse = await api.get('/user/classes')
      setClasses(classesResponse.data.data.classes)

      // Charger les statistiques selon le rôle
      if (user.role === 'teacher') {
        const progressResponse = await api.get(`/academic/progress/${user.id}`)
        setStats(progressResponse.data.data)
      } else if (user.role === 'student') {
        const gradesResponse = await api.get(`/academic/grades/${user.id}`)
        setStats(gradesResponse.data.data)
      }
    } catch (error) {
      console.error('Erreur chargement dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="loading">Chargement du dashboard...</div>
  }

  return (
    <div className="container">
      <h2>Dashboard - {user.email}</h2>
      <p>Rôle: {user.role}</p>

      <div className="row">
        <div className="col-md-6">
          <div className="card">
            <h3>Classes</h3>
            {classes.length > 0 ? (
              <ul>
                {classes.map(classe => (
                  <li key={classe.id}>
                    {classe.name} ({classe.level}) - {classe.member_count} membres
                  </li>
                ))}
              </ul>
            ) : (
              <p>Aucune classe assignée</p>
            )}
          </div>
        </div>

        <div className="col-md-6">
          <div className="card">
            <h3>Statistiques</h3>
            {user.role === 'teacher' && stats?.progress && (
              <div>
                <p>Progression des classes :</p>
                <ul>
                  {stats.progress.map(prog => (
                    <li key={prog.id}>
                      {prog.class_name}: {prog.coverage_percent}%
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {user.role === 'student' && stats?.grades && (
              <div>
                <p>Dernières notes :</p>
                <ul>
                  {stats.grades.slice(0, 5).map(grade => (
                    <li key={grade.id}>
                      {grade.subject}: {grade.score}/20 ({grade.term})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Actions rapides</h3>
        <div className="d-flex gap-2">
          {user.role === 'teacher' && (
            <a href="/grades" className="btn">
              Saisir des notes
            </a>
          )}
          {user.role === 'student' && (
            <a href="/reports" className="btn">
              Consulter mes bulletins
            </a>
          )}
          <a href="/timetable" className="btn btn-secondary">
            Voir l'emploi du temps
          </a>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
