import express from 'express';
import { z } from 'zod';
import db from './db.js';
import redis from './redis.js';
import { ok, err } from './util.js';

const router = express.Router();

// Validation schemas
const classSchema = z.object({
  name: z.string().min(1),
  level: z.string().min(1)
});

const classMemberSchema = z.object({
  class_id: z.string().uuid(),
  user_id: z.string().uuid(),
  role: z.enum(['teacher', 'student'])
});

// GET /classes - Liste des classes
router.get('/classes', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT c.*, 
             COUNT(cm.user_id) as member_count
      FROM usr.classes c
      LEFT JOIN usr.class_members cm ON c.id = cm.class_id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `);
    return ok(res, { classes: result.rows });
  } catch (error) {
    console.error('Erreur liste classes:', error);
    return err(res, 'Erreur serveur', 500);
  }
});

// POST /classes - Créer une classe
router.post('/classes', async (req, res) => {
  try {
    const { name, level } = classSchema.parse(req.body);
    
    const result = await db.query(
      'INSERT INTO usr.classes (name, level) VALUES ($1, $2) RETURNING *',
      [name, level]
    );
    
    return ok(res, { class: result.rows[0] }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return err(res, 'Données invalides: ' + error.errors.map(e => e.message).join(', '), 400);
    }
    console.error('Erreur création classe:', error);
    return err(res, 'Erreur serveur', 500);
  }
});

// GET /classes/:id - Détails d'une classe
router.get('/classes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Récupérer la classe
    const classResult = await db.query('SELECT * FROM usr.classes WHERE id = $1', [id]);
    if (classResult.rows.length === 0) {
      return err(res, 'Classe non trouvée', 404);
    }
    
    // Récupérer les membres
    const membersResult = await db.query(`
      SELECT cm.*, u.email, u.role as user_role
      FROM usr.class_members cm
      JOIN auth.users u ON cm.user_id = u.id
      WHERE cm.class_id = $1
      ORDER BY cm.role, u.email
    `, [id]);
    
    return ok(res, {
      class: classResult.rows[0],
      members: membersResult.rows
    });
  } catch (error) {
    console.error('Erreur détails classe:', error);
    return err(res, 'Erreur serveur', 500);
  }
});

// POST /classes/:id/members - Ajouter un membre à une classe
router.post('/classes/:id/members', async (req, res) => {
  try {
    const { id: classId } = req.params;
    const { user_id, role } = classMemberSchema.parse(req.body);
    
    // Vérifier que la classe existe
    const classExists = await db.query('SELECT id FROM usr.classes WHERE id = $1', [classId]);
    if (classExists.rows.length === 0) {
      return err(res, 'Classe non trouvée', 404);
    }
    
    // Vérifier que l'utilisateur existe
    const userExists = await db.query('SELECT id, role FROM auth.users WHERE id = $1', [user_id]);
    if (userExists.rows.length === 0) {
      return err(res, 'Utilisateur non trouvé', 404);
    }
    
    // Vérifier que le rôle correspond
    const userRole = userExists.rows[0].role;
    if ((role === 'teacher' && userRole !== 'teacher') || 
        (role === 'student' && userRole !== 'student')) {
      return err(res, 'Le rôle de l\'utilisateur ne correspond pas', 400);
    }
    
    // Ajouter le membre
    const result = await db.query(
      'INSERT INTO usr.class_members (class_id, user_id, role) VALUES ($1, $2, $3) RETURNING *',
      [classId, user_id, role]
    );
    
    return ok(res, { member: result.rows[0] }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return err(res, 'Données invalides: ' + error.errors.map(e => e.message).join(', '), 400);
    }
    if (error.code === '23505') { // Unique constraint violation
      return err(res, 'L\'utilisateur est déjà membre de cette classe', 409);
    }
    console.error('Erreur ajout membre:', error);
    return err(res, 'Erreur serveur', 500);
  }
});

// DELETE /classes/:id/members/:userId - Retirer un membre d'une classe
router.delete('/classes/:id/members/:userId', async (req, res) => {
  try {
    const { id: classId, userId } = req.params;
    
    const result = await db.query(
      'DELETE FROM usr.class_members WHERE class_id = $1 AND user_id = $2 RETURNING *',
      [classId, userId]
    );
    
    if (result.rows.length === 0) {
      return err(res, 'Membre non trouvé', 404);
    }
    
    return ok(res, { message: 'Membre retiré avec succès' });
  } catch (error) {
    console.error('Erreur suppression membre:', error);
    return err(res, 'Erreur serveur', 500);
  }
});

// GET /users/available - Utilisateurs disponibles pour assignation
router.get('/users/available', async (req, res) => {
  try {
    const { role, classId } = req.query;
    
    let query = 'SELECT id, email, role FROM auth.users WHERE 1=1';
    const params = [];
    let paramCount = 0;
    
    if (role) {
      paramCount++;
      query += ` AND role = $${paramCount}`;
      params.push(role);
    }
    
    if (classId) {
      paramCount++;
      query += ` AND id NOT IN (SELECT user_id FROM usr.class_members WHERE class_id = $${paramCount})`;
      params.push(classId);
    }
    
    query += ' ORDER BY email';
    
    const result = await db.query(query, params);
    return ok(res, { users: result.rows });
  } catch (error) {
    console.error('Erreur utilisateurs disponibles:', error);
    return err(res, 'Erreur serveur', 500);
  }
});

export default router;
