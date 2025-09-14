import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/api'

function ReportView() {
  const { user } = useAuth()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTerm, setSelectedTerm] = useState('T1')

  useEffect(() => {
    loadReports()
  }, [selectedTerm])

  const loadReports = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/report/reports?student_id=${user.id}&term=${selectedTerm}`)
      setReports(response.data.data.reports)
    } catch (error) {
      console.error('Erreur chargement rapports:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateReport = async () => {
    try {
      setLoading(true)
      const response = await api.post('/report/generate/student', {
        student_id: user.id,
        term: selectedTerm
      })

      if (response.data.data.download_url) {
        // Ouvrir le PDF dans un nouvel onglet
        window.open(response.data.data.download_url, '_blank')
        loadReports() // Recharger la liste
      }
    } catch (error) {
      alert('Erreur: ' + (error.response?.data?.error || 'Erreur inconnue'))
    } finally {
      setLoading(false)
    }
  }

  const downloadReport = (url) => {
    window.open(url, '_blank')
  }

  if (loading) {
    return <div className="loading">Chargement des bulletins...</div>
  }

  return (
    <div className="container">
      <h2>Mes bulletins</h2>

      <div className="card">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <label htmlFor="term" className="form-group">
              Terme:
              <select
                id="term"
                className="form-control"
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                style={{ width: 'auto', display: 'inline-block', marginLeft: '10px' }}
              >
                <option value="T1">Terme 1</option>
                <option value="T2">Terme 2</option>
                <option value="T3">Terme 3</option>
              </select>
            </label>
          </div>
          <button 
            className="btn btn-success"
            onClick={generateReport}
            disabled={loading}
          >
            {loading ? 'Génération...' : 'Générer un nouveau bulletin'}
          </button>
        </div>

        {reports.length > 0 ? (
          <div>
            <h3>Bulletins disponibles</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>Terme</th>
                  <th>Date de génération</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map(report => (
                  <tr key={report.id}>
                    <td>{report.term}</td>
                    <td>{new Date(report.created_at).toLocaleDateString('fr-FR')}</td>
                    <td>
                      <button 
                        className="btn btn-primary"
                        onClick={() => downloadReport(report.url)}
                      >
                        Télécharger
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center">
            <p>Aucun bulletin disponible pour le terme {selectedTerm}</p>
            <p>Cliquez sur "Générer un nouveau bulletin" pour créer votre premier bulletin.</p>
          </div>
        )}
      </div>

      {/* Afficher les notes récentes */}
      <div className="card">
        <h3>Mes notes récentes</h3>
        <RecentGrades studentId={user.id} term={selectedTerm} />
      </div>
    </div>
  )
}

function RecentGrades({ studentId, term }) {
  const [grades, setGrades] = useState([])
  const [average, setAverage] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadGrades()
  }, [studentId, term])

  const loadGrades = async () => {
    try {
      setLoading(true)
      
      // Charger les notes
      const gradesResponse = await api.get(`/academic/grades/${studentId}?term=${term}`)
      setGrades(gradesResponse.data.data.grades)

      // Charger la moyenne
      const averageResponse = await api.get(`/academic/grades/${studentId}/average?term=${term}`)
      setAverage(averageResponse.data.data)
    } catch (error) {
      console.error('Erreur chargement notes:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Chargement des notes...</div>
  }

  if (grades.length === 0) {
    return <p>Aucune note pour le terme {term}</p>
  }

  return (
    <div>
      {average && (
        <div className="alert alert-info">
          <strong>Moyenne générale: {average.overall_average}/20</strong>
          <br />
          <strong>Orientation: </strong>
          {average.overall_average >= 16 ? 'Excellent' :
           average.overall_average >= 14 ? 'Très bien' :
           average.overall_average >= 12 ? 'Bien' :
           average.overall_average >= 10 ? 'Passable' : 'Insuffisant'}
        </div>
      )}

      <table className="table">
        <thead>
          <tr>
            <th>Matière</th>
            <th>Note</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {grades.map(grade => (
            <tr key={grade.id}>
              <td>{grade.subject}</td>
              <td>{grade.score}/20</td>
              <td>{new Date(grade.created_at).toLocaleDateString('fr-FR')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ReportView
