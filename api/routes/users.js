import express from 'express';
import bcrypt from 'bcrypt';
import { query } from '../db.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Aplica auth y rol admin a todas las rutas de /users
router.use(verifyToken, requireAdmin);

function mapRow(row) {
  return {
    username: row.username,
    rol: row.rol,
    nombre: row.nombre,
    nombreCompleto: row.nombre_completo,
    cedula: row.cedula,
    area: row.area,
    empresa: row.empresa,
    correo: row.correo,
    celular: row.celular,
    activo: row.activo
  };
}

// GET /users - listar usuarios (sin password)
router.get('/', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT username, rol, nombre, nombre_completo, cedula, area, empresa, correo, celular, activo
       FROM users ORDER BY username ASC`
    );
    return res.json(rows.map(mapRow));
  } catch (err) {
    console.error('GET /users error', err);
    return res.status(500).json({ error: 'Error interno' });
  }
});

// POST /users - crear usuario
router.post('/', async (req, res) => {
  try {
    const { username, password, rol = 'usuario', nombre, nombreCompleto, cedula, area, empresa, correo, celular, activo = true } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: 'username y password son requeridos' });

    const hash = await bcrypt.hash(String(password), 10);
    await query(
      `INSERT INTO users (username, password_hash, rol, nombre, nombre_completo, cedula, area, empresa, correo, celular, activo)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [String(username).toLowerCase(), hash, rol, nombre || null, nombreCompleto || null, cedula || null, area || null, empresa || null, correo || null, celular || null, !!activo]
    );
    return res.status(201).json({ ok: true });
  } catch (err) {
    if (err?.code === '23505') return res.status(409).json({ error: 'username ya existe' });
    console.error('POST /users error', err);
    return res.status(500).json({ error: 'Error interno' });
  }
});

// PATCH /users/:username - actualizar datos (y opcionalmente password)
router.patch('/:username', async (req, res) => {
  try {
    const username = String(req.params.username || '').toLowerCase();
    if (!username) return res.status(400).json({ error: 'username requerido' });

    const { password, rol, nombre, nombreCompleto, cedula, area, empresa, correo, celular, activo } = req.body || {};

    // Construir SET dinámico
    const sets = [];
    const vals = [];
    let i = 1;

    if (password) {
      const hash = await bcrypt.hash(String(password), 10);
      sets.push(`password_hash = $${i++}`);
      vals.push(hash);
    }
    if (rol !== undefined) { sets.push(`rol = $${i++}`); vals.push(rol); }
    if (nombre !== undefined) { sets.push(`nombre = $${i++}`); vals.push(nombre); }
    if (nombreCompleto !== undefined) { sets.push(`nombre_completo = $${i++}`); vals.push(nombreCompleto); }
    if (cedula !== undefined) { sets.push(`cedula = $${i++}`); vals.push(cedula); }
    if (area !== undefined) { sets.push(`area = $${i++}`); vals.push(area); }
    if (empresa !== undefined) { sets.push(`empresa = $${i++}`); vals.push(empresa); }
    if (correo !== undefined) { sets.push(`correo = $${i++}`); vals.push(correo); }
    if (celular !== undefined) { sets.push(`celular = $${i++}`); vals.push(celular); }
    if (activo !== undefined) { sets.push(`activo = $${i++}`); vals.push(!!activo); }

    if (!sets.length) return res.status(400).json({ error: 'Nada para actualizar' });

    vals.push(username);
    const sql = `UPDATE users SET ${sets.join(', ')} WHERE username = $${i} RETURNING username`;
    const { rowCount } = await query(sql, vals);
    if (!rowCount) return res.status(404).json({ error: 'Usuario no encontrado' });
    return res.json({ ok: true });
  } catch (err) {
    console.error('PATCH /users/:username error', err);
    return res.status(500).json({ error: 'Error interno' });
  }
});

// PATCH /users/:username/state - activar/desactivar
router.patch('/:username/state', async (req, res) => {
  try {
    const username = String(req.params.username || '').toLowerCase();
    const { activo } = req.body || {};
    if (activo === undefined) return res.status(400).json({ error: 'activo requerido (true/false)' });

    const { rowCount } = await query('UPDATE users SET activo = $1 WHERE username = $2', [!!activo, username]);
    if (!rowCount) return res.status(404).json({ error: 'Usuario no encontrado' });
    return res.json({ ok: true });
  } catch (err) {
    console.error('PATCH /users/:username/state error', err);
    return res.status(500).json({ error: 'Error interno' });
  }
});

export default router;
