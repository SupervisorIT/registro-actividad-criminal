import jwt from 'jsonwebtoken';
import { query } from '../db.js';

export async function verifyToken(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ')? auth.slice(7) : '';
    if (!token) return res.status(401).json({ error: 'Sin token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    req.user = decoded;

    // Comprobar si el usuario tiene cambio de contraseña forzado en DB
    try {
      const { rows } = await query('SELECT force_password_change FROM users WHERE id = $1 LIMIT 1', [decoded.sub]);
      const force = !!rows?.[0]?.force_password_change;
      if (force) {
        // Rutas permitidas mientras tenga el flag
        const method = (req.method || '').toUpperCase();
        const path = (req.path || '').toLowerCase();
        const allowed = (
          (method === 'POST' && path === '/auth/password/change') ||
          (method === 'POST' && path === '/auth/logout') ||
          (method === 'GET' && path === '/auth/validate')
        );
        if (!allowed) {
          return res.status(403).json({ error: 'Debe cambiar su contraseña para continuar.' });
        }
      }
    } catch (_) {
      // Si falla la verificación de DB, continuar sin bloquear
    }

    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  if (req.user.rol !== 'admin') return res.status(403).json({ error: 'Requiere rol admin' });
  return next();
}
