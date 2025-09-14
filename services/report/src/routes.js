import express from 'express';
import { z } from 'zod';
import db from './db.js';
import redis from './redis.js';
import { ok, err } from './util.js';
import { PDFGenerator } from './pdfGenerator.js';

const router = express.Router();
const pdfGenerator = new PDFGenerator();

// Validation schemas
const reportRequestSchema = z.object({
  student_id: z.string().uuid().optional(),
  class_id: z.string().uuid().optional(),
  term: z.string().min(1)
});

// POST /generate/student - Générer un bulletin d'étudiant
router.post('/generate/student', async (req, res) => {
  try {
    const { student_id, term } = reportRequestSchema.parse(req.body);
    
    if (!student_id) {
      return err(res, 'ID étudiant requis', 400);
    }

    // Récupérer les données de l'étudiant
    const studentResult = await db.query('SELECT id, email FROM auth.users WHERE id = $1', [student_id]);
    if (studentResult.rows.length === 0) {
      return err(res, 'Étudiant non trouvé', 404);
    }

    // Récupérer les notes
    const gradesResult = await db.query(`
      SELECT subject, score, created_at
      FROM academic.grades 
      WHERE student_id = $1 AND term = $2
      ORDER BY subject, created_at
    `, [student_id, term]);

    if (gradesResult.rows.length === 0) {
      return err(res, 'Aucune note trouvée pour ce terme', 404);
    }

    // Générer le PDF
    const { filename, filepath } = pdfGenerator.generateStudentReport(
      studentResult.rows[0],
      gradesResult.rows,
      term
    );

    // Enregistrer dans la base de données
    const reportResult = await db.query(`
      INSERT INTO report.generated_reports (student_id, term, url)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [student_id, term, `/reports/${filename}`]);

    return ok(res, {
      report: reportResult.rows[0],
      download_url: `/reports/${filename}`,
      message: 'Bulletin généré avec succès'
    }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return err(res, 'Données invalides: ' + error.errors.map(e => e.message).join(', '), 400);
    }
    console.error('Erreur génération bulletin:', error);
    return err(res, 'Erreur serveur', 500);
  }
});

// POST /generate/class - Générer un rapport de classe
router.post('/generate/class', async (req, res) => {
  try {
    const { class_id, term } = reportRequestSchema.parse(req.body);
    
    if (!class_id) {
      return err(res, 'ID classe requis', 400);
    }

    // Récupérer les données de la classe
    const classResult = await db.query('SELECT id, name, level FROM usr.classes WHERE id = $1', [class_id]);
    if (classResult.rows.length === 0) {
      return err(res, 'Classe non trouvée', 404);
    }

    // Récupérer les statistiques des élèves
    const statsResult = await db.query(`
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
    `, [class_id, term]);

    if (statsResult.rows.length === 0) {
      return err(res, 'Aucun élève trouvé dans cette classe', 404);
    }

    // Générer le PDF
    const { filename, filepath } = pdfGenerator.generateClassReport(
      classResult.rows[0],
      statsResult.rows,
      term
    );

    return ok(res, {
      download_url: `/reports/${filename}`,
      class_name: classResult.rows[0].name,
      term,
      student_count: statsResult.rows.length,
      message: 'Rapport de classe généré avec succès'
    }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return err(res, 'Données invalides: ' + error.errors.map(e => e.message).join(', '), 400);
    }
    console.error('Erreur génération rapport classe:', error);
    return err(res, 'Erreur serveur', 500);
  }
});

// GET /reports/:filename - Télécharger un rapport
router.get('/reports/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filepath = `./reports/${filename}`;
    
    // Vérifier que le fichier existe
    const fs = await import('fs');
    if (!fs.existsSync(filepath)) {
      return err(res, 'Fichier non trouvé', 404);
    }

    // Envoyer le fichier
    res.download(filepath, filename);
  } catch (error) {
    console.error('Erreur téléchargement rapport:', error);
    return err(res, 'Erreur serveur', 500);
  }
});

// GET /reports - Liste des rapports générés
router.get('/reports', async (req, res) => {
  try {
    const { student_id, term } = req.query;
    
    let query = `
      SELECT r.*, u.email as student_email
      FROM report.generated_reports r
      JOIN auth.users u ON r.student_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;
    
    if (student_id) {
      paramCount++;
      query += ` AND r.student_id = $${paramCount}`;
      params.push(student_id);
    }
    
    if (term) {
      paramCount++;
      query += ` AND r.term = $${paramCount}`;
      params.push(term);
    }
    
    query += ' ORDER BY r.created_at DESC';
    
    const result = await db.query(query, params);
    return ok(res, { reports: result.rows });
  } catch (error) {
    console.error('Erreur liste rapports:', error);
    return err(res, 'Erreur serveur', 500);
  }
});

// GET /stats - Statistiques générales
router.get('/stats', async (req, res) => {
  try {
    const { term } = req.query;
    
    if (!term) {
      return err(res, 'Terme requis', 400);
    }

    // Statistiques générales
    const statsResult = await db.query(`
      SELECT 
        COUNT(DISTINCT g.student_id) as students_with_grades,
        COUNT(g.id) as total_grades,
        AVG(g.score) as overall_average,
        COUNT(DISTINCT g.subject) as subjects_count
      FROM academic.grades g
      WHERE g.term = $1
    `, [term]);

    // Top 5 des élèves
    const topStudentsResult = await db.query(`
      SELECT 
        u.email as student_email,
        AVG(g.score) as average,
        COUNT(g.score) as total_grades
      FROM academic.grades g
      JOIN auth.users u ON g.student_id = u.id
      WHERE g.term = $1
      GROUP BY u.id, u.email
      ORDER BY average DESC
      LIMIT 5
    `, [term]);

    // Répartition par orientation
    const orientationResult = await db.query(`
      SELECT 
        CASE 
          WHEN AVG(g.score) >= 16 THEN 'Excellent'
          WHEN AVG(g.score) >= 14 THEN 'Très bien'
          WHEN AVG(g.score) >= 12 THEN 'Bien'
          WHEN AVG(g.score) >= 10 THEN 'Passable'
          ELSE 'Insuffisant'
        END as orientation,
        COUNT(DISTINCT g.student_id) as count
      FROM academic.grades g
      WHERE g.term = $1
      GROUP BY 
        CASE 
          WHEN AVG(g.score) >= 16 THEN 'Excellent'
          WHEN AVG(g.score) >= 14 THEN 'Très bien'
          WHEN AVG(g.score) >= 12 THEN 'Bien'
          WHEN AVG(g.score) >= 10 THEN 'Passable'
          ELSE 'Insuffisant'
        END
    `, [term]);

    return ok(res, {
      term,
      general_stats: statsResult.rows[0],
      top_students: topStudentsResult.rows,
      orientation_distribution: orientationResult.rows
    });
  } catch (error) {
    console.error('Erreur statistiques:', error);
    return err(res, 'Erreur serveur', 500);
  }
});

export default router;
