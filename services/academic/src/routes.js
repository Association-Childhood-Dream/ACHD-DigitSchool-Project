import express from 'express';
import { z } from 'zod';
import db from './db.js';
import redis from './redis.js';
import { ok, err } from './util.js';

const router = express.Router();

// Validation schemas
const gradeSchema = z.object({
  student_id: z.string().uuid(),
  subject: z.string().min(1),
  term: z.string().min(1),
  score: z.number().min(0).max(20)
});

const progressSchema = z.object({
  teacher_id: z.string().uuid(),
  class_id: z.string().uuid(),
  coverage_percent: z.number().min(0).max(100)
});

// POST /grades - Ajouter une note
router.post('/grades', async (req, res) => {
  try {
    const { student_id, subject, term, score } = gradeSchema.parse(req.body);
    
    const result = await db.query(
      'INSERT INTO academic.grades (student_id, subject, term, score) VALUES ($1, $2, $3, $4) RETURNING *',
      [student_id, subject, term, score]
    );
    
    // Invalider le cache des moyennes
    await redis.del(`grades:${student_id}:${term}`);
    
    return ok(res, { grade: result.rows[0] }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return err(res, 'Données invalides: ' + error.errors.map(e => e.message).join(', '), 400);
    }
    console.error('Erreur ajout note:', error);
    return err(res, 'Erreur serveur', 500);
  }
});

// GET /grades/:studentId - Notes d'un étudiant
router.get('/grades/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { term } = req.query;
    
    let query = 'SELECT * FROM academic.grades WHERE student_id = $1';
    const params = [studentId];
    
    if (term) {
      query += ' AND term = $2';
      params.push(term);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await db.query(query, params);
    return ok(res, { grades: result.rows });
  } catch (error) {
    console.error('Erreur récupération notes:', error);
    return err(res, 'Erreur serveur', 500);
  }
});

// GET /grades/:studentId/average - Moyenne d'un étudiant
router.get('/grades/:studentId/average', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { term } = req.query;
    
    if (!term) {
      return err(res, 'Terme requis', 400);
    }
    
    // Vérifier le cache
    const cacheKey = `grades:${studentId}:${term}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return ok(res, JSON.parse(cached));
    }
    
    const result = await db.query(`
      SELECT 
        AVG(score) as average,
        COUNT(*) as total_grades,
        subject,
        AVG(score) as subject_average
      FROM academic.grades 
      WHERE student_id = $1 AND term = $2
      GROUP BY subject
      ORDER BY subject
    `, [studentId, term]);
    
    const overallAverage = await db.query(`
      SELECT AVG(score) as overall_average, COUNT(*) as total_grades
      FROM academic.grades 
      WHERE student_id = $1 AND term = $2
    `, [studentId, term]);
    
    const data = {
      student_id: studentId,
      term,
      overall_average: parseFloat(overallAverage.rows[0]?.overall_average || 0).toFixed(2),
      total_grades: parseInt(overallAverage.rows[0]?.total_grades || 0),
      subjects: result.rows.map(row => ({
        subject: row.subject,
        average: parseFloat(row.subject_average).toFixed(2)
      }))
    };
    
    // Mettre en cache pour 1 heure
    await redis.setex(cacheKey, 3600, JSON.stringify(data));
    
    return ok(res, data);
  } catch (error) {
    console.error('Erreur calcul moyenne:', error);
    return err(res, 'Erreur serveur', 500);
  }
});

// GET /grades/class/:classId - Notes d'une classe
router.get('/grades/class/:classId', async (req, res) => {
  try {
    const { classId } = req.params;
    const { term } = req.query;
    
    let query = `
      SELECT g.*, u.email as student_email
      FROM academic.grades g
      JOIN auth.users u ON g.student_id = u.id
      JOIN usr.class_members cm ON u.id = cm.user_id
      WHERE cm.class_id = $1
    `;
    const params = [classId];
    
    if (term) {
      query += ' AND g.term = $2';
      params.push(term);
    }
    
    query += ' ORDER BY u.email, g.created_at DESC';
    
    const result = await db.query(query, params);
    return ok(res, { grades: result.rows });
  } catch (error) {
    console.error('Erreur notes classe:', error);
    return err(res, 'Erreur serveur', 500);
  }
});

// GET /grades/class/:classId/statistics - Statistiques d'une classe
router.get('/grades/class/:classId/statistics', async (req, res) => {
  try {
    const { classId } = req.params;
    const { term } = req.query;
    
    if (!term) {
      return err(res, 'Terme requis', 400);
    }
    
    const result = await db.query(`
      SELECT 
        u.id as student_id,
        u.email as student_email,
        AVG(g.score) as average,
        COUNT(g.score) as total_grades,
        CASE 
          WHEN AVG(g.score) >= 16 THEN 'Excellent'
          WHEN AVG(g.score) >= 14 THEN 'Très bien'
          WHEN AVG(g.score) >= 12 THEN 'Bien'
          WHEN AVG(g.score) >= 10 THEN 'Passable'
          ELSE 'Insuffisant'
        END as orientation
      FROM auth.users u
      JOIN usr.class_members cm ON u.id = cm.user_id
      LEFT JOIN academic.grades g ON u.id = g.student_id AND g.term = $2
      WHERE cm.class_id = $1 AND cm.role = 'student'
      GROUP BY u.id, u.email
      ORDER BY average DESC NULLS LAST
    `, [classId, term]);
    
    return ok(res, { statistics: result.rows });
  } catch (error) {
    console.error('Erreur statistiques classe:', error);
    return err(res, 'Erreur serveur', 500);
  }
});

// POST /progress - Mettre à jour la progression d'un enseignant
router.post('/progress', async (req, res) => {
  try {
    const { teacher_id, class_id, coverage_percent } = progressSchema.parse(req.body);
    
    const result = await db.query(`
      INSERT INTO academic.teacher_progress (teacher_id, class_id, coverage_percent)
      VALUES ($1, $2, $3)
      ON CONFLICT (teacher_id, class_id) 
      DO UPDATE SET coverage_percent = $3, updated_at = now()
      RETURNING *
    `, [teacher_id, class_id, coverage_percent]);
    
    return ok(res, { progress: result.rows[0] }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return err(res, 'Données invalides: ' + error.errors.map(e => e.message).join(', '), 400);
    }
    console.error('Erreur progression enseignant:', error);
    return err(res, 'Erreur serveur', 500);
  }
});

// GET /progress/:teacherId - Progression d'un enseignant
router.get('/progress/:teacherId', async (req, res) => {
  try {
    const { teacherId } = req.params;
    
    const result = await db.query(`
      SELECT tp.*, c.name as class_name, c.level
      FROM academic.teacher_progress tp
      JOIN usr.classes c ON tp.class_id = c.id
      WHERE tp.teacher_id = $1
      ORDER BY tp.updated_at DESC
    `, [teacherId]);
    
    return ok(res, { progress: result.rows });
  } catch (error) {
    console.error('Erreur récupération progression:', error);
    return err(res, 'Erreur serveur', 500);
  }
});

export default router;
