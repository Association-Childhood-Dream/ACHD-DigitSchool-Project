import express from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import db from './db.js';
import redis from './redis.js';
import { ok, err } from './util.js';

const router = express.Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['admin', 'teacher', 'student', 'parent'])
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

// Middleware d'authentification
export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return err(res, 'Token d\'accès requis', 401);
  }

  try {
    // Vérifier le cache Redis d'abord
    const cached = await redis.get(`token:${token}`);
    if (cached) {
      req.user = JSON.parse(cached);
      return next();
    }

    // Vérifier le token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Récupérer l'utilisateur depuis la DB
    const result = await db.query('SELECT id, email, role FROM auth.users WHERE id = $1', [decoded.userId]);
    if (result.rows.length === 0) {
      return err(res, 'Utilisateur non trouvé', 401);
    }

    const user = result.rows[0];
    
    // Mettre en cache pour 1 heure
    await redis.setex(`token:${token}`, 3600, JSON.stringify(user));
    
    req.user = user;
    next();
  } catch (error) {
    return err(res, 'Token invalide', 401);
  }
};

// Middleware de vérification des rôles
export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return err(res, 'Authentification requise', 401);
    }
    
    if (!roles.includes(req.user.role)) {
      return err(res, 'Permissions insuffisantes', 403);
    }
    
    next();
  };
};

// POST /register - Inscription
router.post('/register', async (req, res) => {
  try {
    const { email, password, role } = registerSchema.parse(req.body);

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await db.query('SELECT id FROM auth.users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return err(res, 'Email déjà utilisé', 409);
    }

    // Stocker le mot de passe en clair pour simplifier le développement
    const passwordHash = password;

    // Créer l'utilisateur
    const result = await db.query(
      'INSERT INTO auth.users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role, created_at',
      [email, passwordHash, role]
    );

    const user = result.rows[0];
    return ok(res, { user }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return err(res, 'Données invalides: ' + error.errors.map(e => e.message).join(', '), 400);
    }
    console.error('Erreur registration:', error);
    return err(res, 'Erreur serveur', 500);
  }
});

// POST /login - Connexion
router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Récupérer l'utilisateur
    const result = await db.query(
      'SELECT id, email, password_hash, role FROM auth.users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return err(res, 'Email ou mot de passe incorrect', 401);
    }

    const user = result.rows[0];

    // Vérifier le mot de passe (comparaison directe pour simplifier le développement)
    if (password !== user.password_hash) {
      return err(res, 'Email ou mot de passe incorrect', 401);
    }

    // Générer le token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Mettre en cache
    const userInfo = { id: user.id, email: user.email, role: user.role };
    await redis.setex(`token:${token}`, 3600, JSON.stringify(userInfo));

    return ok(res, {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return err(res, 'Données invalides: ' + error.errors.map(e => e.message).join(', '), 400);
    }
    console.error('Erreur login:', error);
    return err(res, 'Erreur serveur', 500);
  }
});

// POST /logout - Déconnexion
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      await redis.del(`token:${token}`);
    }
    
    return ok(res, { message: 'Déconnexion réussie' });
  } catch (error) {
    console.error('Erreur logout:', error);
    return err(res, 'Erreur serveur', 500);
  }
});

// GET /me - Profil utilisateur
router.get('/me', authenticateToken, async (req, res) => {
  return ok(res, { user: req.user });
});

// GET /users - Liste des utilisateurs (admin seulement)
router.get('/users', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const result = await db.query('SELECT id, email, role, created_at FROM auth.users ORDER BY created_at DESC');
    return ok(res, { users: result.rows });
  } catch (error) {
    console.error('Erreur liste utilisateurs:', error);
    return err(res, 'Erreur serveur', 500);
  }
});

export default router;
