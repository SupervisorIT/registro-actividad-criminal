import jwt from 'jsonwebtoken';

export function verifyToken(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ')? auth.slice(7) : '';
    if (!token) return res.status(401).json({ error: 'Sin token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    req.user = decoded;
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

// Bloquea el acceso a rutas normales si el usuario debe cambiar contraseña.
// Debe aplicarse DESPUÉS de verifyToken y no en rutas como /auth/login o /auth/password/change
export function requireNoForceChange(req, res, next) {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autenticado' });
    if (req.user.force_change === true) {
      return res.status(403).json({ error: 'Debe cambiar su contraseña antes de continuar' });
    }
    return next();
  } catch (_) {
    return res.status(401).json({ error: 'No autenticado' });
  }
}
