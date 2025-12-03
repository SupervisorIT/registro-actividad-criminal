import express from 'express';
import { query } from '../db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// POST /registros/backup - guarda un snapshot de datos del formulario para auditora interna
router.post('/backup', verifyToken, async (req, res) => {
  try {
    const username = req.user?.username || 'desconocido';
    const { encabezado, delincuentes, delincuentesPersistentes, productosRobados, casos, perdidas } = req.body || {};

    // Fecha base: usar la del encabezado o la fecha actual (YYYY-MM-DD)
    let fechaBase = '';
    try {
      const f = encabezado?.Fecha || encabezado?.fecha || '';
      if (f && /\d{2}\/\d{2}\/\d{4}/.test(f)) {
        const [dd, mm, yyyy] = f.split('/');
        fechaBase = `${yyyy}-${mm}-${dd}`;
      } else if (f && /\d{4}-\d{2}-\d{2}/.test(f)) {
        fechaBase = f.slice(0, 10);
      }
    } catch {}
    if (!fechaBase) {
      const d = new Date();
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      fechaBase = `${yyyy}-${mm}-${dd}`;
    }

    const payload = {
      encabezado: encabezado || {},
      delincuentes: Array.isArray(delincuentes) ? delincuentes : [],
      delincuentesPersistentes: Array.isArray(delincuentesPersistentes) ? delincuentesPersistentes : [],
      productosRobados: Array.isArray(productosRobados) ? productosRobados : [],
      casos: Array.isArray(casos) ? casos : [],
      perdidas: Array.isArray(perdidas) ? perdidas : []
    };

    await query(
      `INSERT INTO registros_backups (username, fecha_base, payload_json)
       VALUES ($1, $2, $3)`,
      [String(username).toLowerCase(), fechaBase, JSON.stringify(payload)]
    );

    return res.status(201).json({ ok: true });
  } catch (err) {
    console.error('POST /registros/backup error', err);
    return res.status(500).json({ error: 'Error interno al guardar respaldo' });
  }
});

export default router;
