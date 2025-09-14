import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/api'

function GradeEntry() {
  const { user } = useAuth()
  const [classes, setClasses] = useState([])
  const [students, setStudents] = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedStudent, setSelectedStudent] = useState('')
  const [subject, setSubject] = useState('')
  const [score, setScore] = useState('')
  const [term, setTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadClasses()
  }, [])

  const loadClasses = async () => {
    try {
      const response = await api.get('/user/classes')
      setClasses(response.data.data.classes)
    } catch (error) {
      console.error('Erreur chargement classes:', error)
    }
  }

  const loadStudents = async (classId) => {
    try {
      const response = await api.get(`/user/classes/${classId}`)
      const members = response.data.data.members.filter(m => m.role === 'student')
      setStudents(members)
    } catch (error) {
      console.error('Erreur chargement étudiants:', error)
    }
  }

  const handleClassChange = (e) => {
    const classId = e.target.value
    setSelectedClass(classId)
    setSelectedStudent('')
    setStudents([])
    
    if (classId) {
      loadStudents(classId)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      await api.post('/academic/grades', {
        student_id: selectedStudent,
        subject,
        term,
        score: parseFloat(score)
      })

      setMessage('Note ajoutée avec succès!')
      setSubject('')
      setScore('')
      setSelectedStudent('')
    } catch (error) {
      setMessage('Erreur: ' + (error.response?.data?.error || 'Erreur inconnue'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <h2>Saisie des notes</h2>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="class">Classe</label>
            <select
              id="class"
              className="form-control"
              value={selectedClass}
              onChange={handleClassChange}
              required
            >
              <option value="">Sélectionner une classe</option>
              {classes.map(classe => (
                <option key={classe.id} value={classe.id}>
                  {classe.name} ({classe.level})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="student">Étudiant</label>
            <select
              id="student"
              className="form-control"
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              required
              disabled={!selectedClass}
            >
              <option value="">Sélectionner un étudiant</option>
              {students.map(student => (
                <option key={student.user_id} value={student.user_id}>
                  {student.email}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="subject">Matière</label>
            <input
              type="text"
              id="subject"
              className="form-control"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="term">Terme</label>
            <select
              id="term"
              className="form-control"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              required
            >
              <option value="">Sélectionner un terme</option>
              <option value="T1">Terme 1</option>
              <option value="T2">Terme 2</option>
              <option value="T3">Terme 3</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="score">Note (sur 20)</label>
            <input
              type="number"
              id="score"
              className="form-control"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              min="0"
              max="20"
              step="0.1"
              required
            />
          </div>

          {message && (
            <div className={`alert ${message.includes('Erreur') ? 'alert-danger' : 'alert-success'}`}>
              {message}
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-success"
            disabled={loading}
          >
            {loading ? 'Ajout en cours...' : 'Ajouter la note'}
          </button>
        </form>
      </div>

      {selectedStudent && (
        <div className="card">
          <h3>Notes existantes</h3>
          <StudentGrades studentId={selectedStudent} />
        </div>
      )}
    </div>
  )
}

function StudentGrades({ studentId }) {
  const [grades, setGrades] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadGrades()
  }, [studentId])

  const loadGrades = async () => {
    try {
      const response = await api.get(`/academic/grades/${studentId}`)
      setGrades(response.data.data.grades)
    } catch (error) {
      console.error('Erreur chargement notes:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Chargement des notes...</div>
  }

  return (
    <table className="table">
      <thead>
        <tr>
          <th>Matière</th>
          <th>Terme</th>
          <th>Note</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        {grades.map(grade => (
          <tr key={grade.id}>
            <td>{grade.subject}</td>
            <td>{grade.term}</td>
            <td>{grade.score}/20</td>
            <td>{new Date(grade.created_at).toLocaleDateString('fr-FR')}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default GradeEntry
