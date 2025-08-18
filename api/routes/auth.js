import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';

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
      `SELECT id, username, password_hash, rol, nombre, nombre_completo, cedula, area, empresa, correo, celular, activo
       FROM users WHERE username = $1 LIMIT 1`,
      [String(username).toLowerCase()]
    );

    if (!rows?.length) return res.status(401).json({ error: 'Credenciales inválidas' });

    const user = rows[0];
    if (user.activo === false) return res.status(403).json({ error: 'Usuario inactivo' });

    const ok = await bcrypt.compare(password, user.password_hash || '');
    if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = jwt.sign(
      { sub: user.id, username: user.username, rol: user.rol },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '8h' }
    );

    const payload = mapUserRowToPayload(user);
    // Detectar campos faltantes que queremos exigir completos para operar
    const required = ['nombre', 'nombreCompleto', 'cedula', 'empresa', 'correo', 'celular'];
    const missingFields = [];
    if (!payload.nombre) missingFields.push('nombre');
    if (!payload.nombreCompleto) missingFields.push('nombreCompleto');
    if (!payload.cedula) missingFields.push('cedula');
    if (!payload.empresa) missingFields.push('empresa');
    if (!payload.correo) missingFields.push('correo');
    if (!payload.celular) missingFields.push('celular');

    return res.json({ token, user: payload, missingFields });
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

export default router;
