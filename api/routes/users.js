import express from 'express';
import bcrypt from 'bcrypt';
import { query } from '../db.js';
import { verifyToken, requireAdmin, requireNoForceChange } from '../middleware/auth.js';

const router = express.Router();

// Aplica solo autenticación a todo el router
router.use(verifyToken);
router.use(requireNoForceChange);

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
router.get('/', requireAdmin, async (req, res) => {
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

// POST /users/bulk - crear usuarios en lote
router.post('/bulk', requireAdmin, async (req, res) => {
  try {
    const { users } = req.body || {};
    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ error: 'Se requiere un arreglo "users" con al menos un elemento' });
    }

    // Normalizar entradas y validar requeridos
    const normalized = users.map(u => ({
      username: String(u?.username || '').toLowerCase().trim(),
      password: String(u?.password || ''),
      rol: u?.rol ?? 'usuario',
      nombre: u?.nombre ?? null,
      nombreCompleto: u?.nombreCompleto ?? null,
      cedula: u?.cedula ?? null,
      area: u?.area ?? null,
      empresa: u?.empresa ?? null,
      correo: u?.correo ?? null,
      celular: u?.celular ?? null,
      activo: u?.activo === undefined ? true : !!u?.activo
    }));

    const invalid = normalized.filter(u => !u.username || !u.password);
    if (invalid.length) {
      return res.status(400).json({ error: 'Cada usuario debe tener username y password' });
    }

    // Hashear passwords en paralelo
    const hashes = await Promise.all(normalized.map(u => bcrypt.hash(u.password, 10)));

    // Construir inserción multi-valor con ON CONFLICT DO NOTHING
    const cols = '(username, password_hash, rol, nombre, nombre_completo, cedula, area, empresa, correo, celular, activo)';
    const values = [];
    const params = [];
    let i = 1;
    for (let idx = 0; idx < normalized.length; idx++) {
      const u = normalized[idx];
      values.push(`($${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++})`);
      params.push(u.username, hashes[idx], u.rol, u.nombre, u.nombreCompleto, u.cedula, u.area, u.empresa, u.correo, u.celular, u.activo);
    }

    const sql = `INSERT INTO users ${cols} VALUES ${values.join(', ')} ON CONFLICT (username) DO NOTHING`;
    const { rowCount } = await query(sql, params);

    return res.status(201).json({ ok: true, inserted: rowCount, skipped: normalized.length - rowCount });
  } catch (err) {
    console.error('POST /users/bulk error', err);
    return res.status(500).json({ error: 'Error interno' });
  }
});

// POST /users - crear usuario
router.post('/', requireAdmin, async (req, res) => {
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
// IMPORTANTE: declarar '/me' ANTES que '/:username' para evitar que 'me' coincida con el parámetro dinámico
router.patch('/me', async (req, res) => {
  try {
    // req.user viene de verifyToken()
    const username = String(req.user?.username || '').toLowerCase();
    if (!username) return res.status(401).json({ error: 'No autenticado' });

    const { nombre, nombreCompleto, cedula, area, empresa, correo, celular } = req.body || {};

    const sets = [];
    const vals = [];
    let i = 1;

    if (nombre !== undefined) { sets.push(`nombre = $${i++}`); vals.push(nombre); }
    if (nombreCompleto !== undefined) { sets.push(`nombre_completo = $${i++}`); vals.push(nombreCompleto); }
    if (cedula !== undefined) { sets.push(`cedula = $${i++}`); vals.push(cedula); }
    if (area !== undefined) { sets.push(`area = $${i++}`); vals.push(area); }
    if (empresa !== undefined) { sets.push(`empresa = $${i++}`); vals.push(empresa); }
    if (correo !== undefined) { sets.push(`correo = $${i++}`); vals.push(correo); }
    if (celular !== undefined) { sets.push(`celular = $${i++}`); vals.push(celular); }

    if (!sets.length) return res.status(400).json({ error: 'Nada para actualizar' });

    vals.push(username);
    const sql = `UPDATE users SET ${sets.join(', ')} WHERE username = $${i} RETURNING username, rol, nombre, nombre_completo, cedula, area, empresa, correo, celular, activo`;
    const { rows } = await query(sql, vals);
    if (!rows?.length) return res.status(404).json({ error: 'Usuario no encontrado' });

    return res.json({ ok: true, user: mapRow(rows[0]) });
  } catch (err) {
    console.error('PATCH /users/me error', err);
    return res.status(500).json({ error: 'Error interno' });
  }
});

// PATCH /users/:username/password-temp - asignar contraseña temporal y forzar cambio en primer login
router.patch('/:username/password-temp', requireAdmin, async (req, res) => {
  try {
    const username = String(req.params.username || '').toLowerCase();
    const { password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: 'username y password son requeridos' });

    const hash = await bcrypt.hash(String(password), 10);
    const { rowCount } = await query(
      `UPDATE users SET password_hash = $1, force_password_change = TRUE WHERE username = $2`,
      [hash, username]
    );
    if (!rowCount) return res.status(404).json({ error: 'Usuario no encontrado' });
    return res.json({ ok: true });
  } catch (err) {
    console.error('PATCH /users/:username/password-temp error', err);
    return res.status(500).json({ error: 'Error interno' });
  }
});

// PATCH /users/:username - actualizar datos (y opcionalmente password)
router.patch('/:username', requireAdmin, async (req, res) => {
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

// PATCH /users/me - actualizar perfil del usuario autenticado (sin admin)
// (la versión anterior de '/me' se ha movido arriba para priorizarla)

// PATCH /users/:username/state - activar/desactivar
router.patch('/:username/state', requireAdmin, async (req, res) => {
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

// GET /users/activity - listar toda la actividad de usuarios (solo admin)
router.get('/activity', requireAdmin, async (req, res) => {
  try {
            const { rows } = await query(`
      SELECT id, user_id, username, login_time, logout_time, duration_minutes
      FROM user_activity 
      ORDER BY login_time DESC
    `);
    return res.json(rows);
  } catch (err) {
    console.error('GET /users/activity error', err);
    // Código de error de PostgreSQL para 'undefined_table'
    if (err.code === '42P01') {
      return res.status(500).json({ error: 'La tabla de actividad de usuarios no existe en la base de datos.' });
    }
    return res.status(500).json({ error: 'Error interno del servidor al consultar la actividad.' });
  }
});

export default router;
