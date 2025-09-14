import express from 'express';
import { z } from 'zod';
import db from './db.js';
import redis from './redis.js';
import { ok, err } from './util.js';

const router = express.Router();

// Validation schemas
const timetableEntrySchema = z.object({
  class_id: z.string().uuid(),
  day_of_week: z.number().int().min(1).max(7),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
  subject: z.string().min(1),
  teacher_id: z.string().uuid().optional(),
  room: z.string().optional()
});

// POST /entries - Créer un créneau d'emploi du temps
router.post('/entries', async (req, res) => {
  try {
    const data = timetableEntrySchema.parse(req.body);
    
    // Vérifier que la classe existe
    const classExists = await db.query('SELECT id FROM usr.classes WHERE id = $1', [data.class_id]);
    if (classExists.rows.length === 0) {
      return err(res, 'Classe non trouvée', 404);
    }
    
    // Vérifier que l'enseignant existe (si fourni)
    if (data.teacher_id) {
      const teacherExists = await db.query('SELECT id FROM auth.users WHERE id = $1 AND role = $2', [data.teacher_id, 'teacher']);
      if (teacherExists.rows.length === 0) {
        return err(res, 'Enseignant non trouvé', 404);
      }
    }
    
    // Vérifier les conflits d'horaires
    const conflictCheck = await db.query(`
      SELECT id FROM timetable.entries 
      WHERE class_id = $1 
        AND day_of_week = $2 
        AND (
          (start_time <= $3 AND end_time > $3) OR
          (start_time < $4 AND end_time >= $4) OR
          (start_time >= $3 AND end_time <= $4)
        )
    `, [data.class_id, data.day_of_week, data.start_time, data.end_time]);
    
    if (conflictCheck.rows.length > 0) {
      return err(res, 'Conflit d\'horaire détecté', 409);
    }
    
    const result = await db.query(`
      INSERT INTO timetable.entries (class_id, day_of_week, start_time, end_time, subject, teacher_id, room)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [data.class_id, data.day_of_week, data.start_time, data.end_time, data.subject, data.teacher_id || null, data.room || null]);
    
    // Invalider le cache
    await redis.del(`timetable:${data.class_id}`);
    
    return ok(res, { entry: result.rows[0] }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return err(res, 'Données invalides: ' + error.errors.map(e => e.message).join(', '), 400);
    }
    console.error('Erreur création créneau:', error);
    return err(res, 'Erreur serveur', 500);
  }
});

// GET /entries/class/:classId - Emploi du temps d'une classe
router.get('/entries/class/:classId', async (req, res) => {
  try {
    const { classId } = req.params;
    
    // Vérifier le cache
    const cacheKey = `timetable:${classId}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return ok(res, JSON.parse(cached));
    }
    
    const result = await db.query(`
      SELECT te.*, c.name as class_name, c.level, u.email as teacher_email
      FROM timetable.entries te
      JOIN usr.classes c ON te.class_id = c.id
      LEFT JOIN auth.users u ON te.teacher_id = u.id
      WHERE te.class_id = $1
      ORDER BY te.day_of_week, te.start_time
    `, [classId]);
    
    // Organiser par jour de la semaine
    const timetable = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: []
    };
    
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    result.rows.forEach(entry => {
      const dayName = dayNames[entry.day_of_week];
      timetable[dayName].push(entry);
    });
    
    const data = {
      class_id: classId,
      class_name: result.rows[0]?.class_name || '',
      level: result.rows[0]?.level || '',
      timetable
    };
    
    // Mettre en cache pour 1 heure
    await redis.setex(cacheKey, 3600, JSON.stringify(data));
    
    return ok(res, data);
  } catch (error) {
    console.error('Erreur récupération emploi du temps:', error);
    return err(res, 'Erreur serveur', 500);
  }
});

// GET /entries/teacher/:teacherId - Emploi du temps d'un enseignant
router.get('/entries/teacher/:teacherId', async (req, res) => {
  try {
    const { teacherId } = req.params;
    
    const result = await db.query(`
      SELECT te.*, c.name as class_name, c.level, u.email as teacher_email
      FROM timetable.entries te
      JOIN usr.classes c ON te.class_id = c.id
      LEFT JOIN auth.users u ON te.teacher_id = u.id
      WHERE te.teacher_id = $1
      ORDER BY te.day_of_week, te.start_time
    `, [teacherId]);
    
    return ok(res, { entries: result.rows });
  } catch (error) {
    console.error('Erreur emploi du temps enseignant:', error);
    return err(res, 'Erreur serveur', 500);
  }
});

// PUT /entries/:id - Modifier un créneau
router.put('/entries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = timetableEntrySchema.parse(req.body);
    
    // Vérifier que le créneau existe
    const existing = await db.query('SELECT * FROM timetable.entries WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return err(res, 'Créneau non trouvé', 404);
    }
    
    // Vérifier les conflits (exclure le créneau actuel)
    const conflictCheck = await db.query(`
      SELECT id FROM timetable.entries 
      WHERE class_id = $1 
        AND day_of_week = $2 
        AND id != $3
        AND (
          (start_time <= $4 AND end_time > $4) OR
          (start_time < $5 AND end_time >= $5) OR
          (start_time >= $4 AND end_time <= $5)
        )
    `, [data.class_id, data.day_of_week, id, data.start_time, data.end_time]);
    
    if (conflictCheck.rows.length > 0) {
      return err(res, 'Conflit d\'horaire détecté', 409);
    }
    
    const result = await db.query(`
      UPDATE timetable.entries 
      SET class_id = $1, day_of_week = $2, start_time = $3, end_time = $4, 
          subject = $5, teacher_id = $6, room = $7
      WHERE id = $8
      RETURNING *
    `, [data.class_id, data.day_of_week, data.start_time, data.end_time, 
        data.subject, data.teacher_id || null, data.room || null, id]);
    
    // Invalider le cache
    await redis.del(`timetable:${data.class_id}`);
    
    return ok(res, { entry: result.rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return err(res, 'Données invalides: ' + error.errors.map(e => e.message).join(', '), 400);
    }
    console.error('Erreur modification créneau:', error);
    return err(res, 'Erreur serveur', 500);
  }
});

// DELETE /entries/:id - Supprimer un créneau
router.delete('/entries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query('DELETE FROM timetable.entries WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return err(res, 'Créneau non trouvé', 404);
    }
    
    // Invalider le cache
    await redis.del(`timetable:${result.rows[0].class_id}`);
    
    return ok(res, { message: 'Créneau supprimé avec succès' });
  } catch (error) {
    console.error('Erreur suppression créneau:', error);
    return err(res, 'Erreur serveur', 500);
  }
});

// GET /entries - Liste de tous les créneaux
router.get('/entries', async (req, res) => {
  try {
    const { class_id, teacher_id, day_of_week } = req.query;
    
    let query = `
      SELECT te.*, c.name as class_name, c.level, u.email as teacher_email
      FROM timetable.entries te
      JOIN usr.classes c ON te.class_id = c.id
      LEFT JOIN auth.users u ON te.teacher_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;
    
    if (class_id) {
      paramCount++;
      query += ` AND te.class_id = $${paramCount}`;
      params.push(class_id);
    }
    
    if (teacher_id) {
      paramCount++;
      query += ` AND te.teacher_id = $${paramCount}`;
      params.push(teacher_id);
    }
    
    if (day_of_week) {
      paramCount++;
      query += ` AND te.day_of_week = $${paramCount}`;
      params.push(parseInt(day_of_week));
    }
    
    query += ' ORDER BY te.day_of_week, te.start_time';
    
    const result = await db.query(query, params);
    return ok(res, { entries: result.rows });
  } catch (error) {
    console.error('Erreur liste créneaux:', error);
    return err(res, 'Erreur serveur', 500);
  }
});

export default router;
