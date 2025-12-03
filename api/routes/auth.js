import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

function mapUserRowToPayload(row) {
  return {
    username: row.username,
    nombre: row.nombre || row.nombre_completo,
    nombreCompleto: row.nombre_completo || row.nombre,
    cedula: row.cedula || '',
    rol: row.rol || 'usuario',
    area: row.area || '',
    empresa: row.empresa || '',
    correo: row.correo || '',
    celular: row.celular || ''
  };
}

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'username y password requeridos' });
    }

    const { rows } = await query(
      `SELECT id, username, password_hash, rol, nombre, nombre_completo, cedula, area, empresa, correo, celular, activo, force_password_change
       FROM users WHERE username = $1 LIMIT 1`,
      [String(username).toLowerCase()]
    );

    if (!rows?.length) return res.status(401).json({ error: 'Credenciales inválidas' });

    const user = rows[0];
    if (user.activo === false) return res.status(403).json({ error: 'Usuario inactivo' });

    const ok = await bcrypt.compare(password, user.password_hash || '');
    if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = jwt.sign(
      { sub: user.id, username: user.username, rol: user.rol, force_change: !!user.force_password_change },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '8h' }
    );

    const payload = mapUserRowToPayload(user);

    // Cerrar cualquier sesión previa abierta de este usuario antes de registrar una nueva
    await query(
      `UPDATE user_activity
         SET logout_time = NOW(),
             duration_minutes = GREATEST(1, ROUND(EXTRACT(EPOCH FROM (NOW() - login_time)) / 60.0))
       WHERE user_id = $1 AND logout_time IS NULL`,
      [user.id]
    );

    // Registrar nueva actividad (una sola sesión activa por usuario)
    const activityResult = await query(
      'INSERT INTO user_activity (user_id, username) VALUES ($1, $2) RETURNING id',
      [user.id, user.username]
    );
    const activityId = activityResult.rows[0].id;

    // Detectar campos faltantes que queremos exigir completos para operar
    const required = ['nombre', 'nombreCompleto', 'cedula', 'empresa', 'correo', 'celular'];
    const missingFields = [];
    if (!payload.nombre) missingFields.push('nombre');
    if (!payload.nombreCompleto) missingFields.push('nombreCompleto');
    if (!payload.cedula) missingFields.push('cedula');
    if (!payload.empresa) missingFields.push('empresa');
    if (!payload.correo) missingFields.push('correo');
    if (!payload.celular) missingFields.push('celular');

    const forceChange = !!user.force_password_change;
    return res.json({ token, user: payload, missingFields, activityId, forceChange });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
});

router.get('/validate', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ')? auth.slice(7) : '';
    if (!token) return res.status(401).json({ error: 'Sin token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    // Opcional: cargar datos del usuario
    return res.json({ ok: true, decoded });
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
});

router.post('/logout', async (req, res) => {
  try {
    const { activityId } = req.body;
    if (!activityId) {
      return res.status(400).json({ error: 'activityId es requerido' });
    }

    const { rows } = await query('SELECT login_time FROM user_activity WHERE id = $1', [activityId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Actividad no encontrada' });
    }

    const loginTime = new Date(rows[0].login_time);
    const logoutTime = new Date();
    const durationMinutes = Math.round((logoutTime - loginTime) / (1000 * 60));

    await query(
      'UPDATE user_activity SET logout_time = $1, duration_minutes = $2 WHERE id = $3',
      [logoutTime, durationMinutes, activityId]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// Cerrar todas las sesiones abiertas (solo admin)
router.post('/sessions/close-all', verifyToken, async (req, res) => {
  try {
    const userId = req.user?.sub;
    const rol = req.user?.rol;
    if (!userId) return res.status(401).json({ error: 'No autenticado' });
    if (rol !== 'admin') return res.status(403).json({ error: 'Solo administradores pueden cerrar todas las sesiones' });

    const { rowCount } = await query(
      `UPDATE user_activity
         SET logout_time = NOW(),
             duration_minutes = GREATEST(1, ROUND(EXTRACT(EPOCH FROM (NOW() - login_time)) / 60.0))
       WHERE logout_time IS NULL`
    );

    return res.json({ ok: true, closed: rowCount });
  } catch (err) {
    console.error('POST /auth/sessions/close-all error', err);
    return res.status(500).json({ error: 'Error interno' });
  }
});

// Cerrar todas las sesiones abiertas excepto la del usuario actual (solo admin)
router.post('/sessions/close-others', verifyToken, async (req, res) => {
  try {
    const userId = req.user?.sub;
    const rol = req.user?.rol;
    if (!userId) return res.status(401).json({ error: 'No autenticado' });
    if (rol !== 'admin') return res.status(403).json({ error: 'Solo administradores pueden cerrar sesiones de otros usuarios' });

    const { rowCount } = await query(
      `UPDATE user_activity
         SET logout_time = NOW(),
             duration_minutes = GREATEST(1, ROUND(EXTRACT(EPOCH FROM (NOW() - login_time)) / 60.0))
       WHERE logout_time IS NULL AND user_id <> $1`,
      [userId]
    );

    return res.json({ ok: true, closed: rowCount });
  } catch (err) {
    console.error('POST /auth/sessions/close-others error', err);
    return res.status(500).json({ error: 'Error interno' });
  }
});

// Cambiar contraseña del usuario autenticado y limpiar force_password_change
router.post('/password/change', verifyToken, async (req, res) => {
  try {
    const userId = req.user?.sub;
    const { newPassword } = req.body || {};
    if (!userId) return res.status(401).json({ error: 'No autenticado' });
    if (!newPassword || String(newPassword).length < 8) {
      return res.status(400).json({ error: 'Nueva contraseña inválida (mínimo 8 caracteres)' });
    }

    const hash = await bcrypt.hash(String(newPassword), 10);
    const { rowCount } = await query(
      'UPDATE users SET password_hash = $1, force_password_change = FALSE WHERE id = $2',
      [hash, userId]
    );
    if (!rowCount) return res.status(404).json({ error: 'Usuario no encontrado' });
    return res.json({ ok: true });
  } catch (err) {
    console.error('POST /auth/password/change error', err);
    return res.status(500).json({ error: 'Error interno' });
  }
});

export default router;
