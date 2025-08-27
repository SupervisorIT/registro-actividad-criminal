import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import { query } from './db.js';
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';

const app = express();

const PORT = process.env.PORT || 8080;
// Orígenes permitidos para el front (agrega/quita según despliegues)
// Permite configurar múltiples orígenes usando CORS_ORIGINS="https://a.com,https://b.com"
const envCorsList = (process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || '')
  .split(',')
  .map(s => s && s.trim())
  .filter(Boolean);

const allowedOrigins = [
  // Dominios de frontend en Render (agrega los que uses)
  'https://registro-actividad-criminal.onrender.com',
  'https://registro-de-actividad-criminal.onrender.com',
  // Orígenes locales comunes
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  ...envCorsList
].filter(Boolean);

const corsOptions = {
  origin: (origin, cb) => {
    // Permitir llamadas sin origin (pings internos) y orígenes explícitos
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    console.warn('[CORS] Origen rechazado:', origin, 'Permitidos:', allowedOrigins);
    return cb(new Error('CORS: origin no permitido: ' + origin), false);
  },
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false, // usamos Bearer token, no cookies
  maxAge: 86400
};

// CORS antes de las rutas
app.use(cors(corsOptions));
// Preflight explícito
app.options('*', cors(corsOptions));

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use('/auth', authRouter);
app.use('/users', usersRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.listen(PORT, () => {
  console.log(`Auth API listening on port ${PORT}`);
});

// --- Auto-migraciones y seed mínimo al iniciar (idempotente, sin shell) ---
async function ensureSchema() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(64) UNIQUE NOT NULL,
      password_hash VARCHAR(120) NOT NULL,
      rol VARCHAR(24) NOT NULL DEFAULT 'usuario',
      nombre VARCHAR(120),
      nombre_completo VARCHAR(180),
      cedula VARCHAR(60),
      area VARCHAR(120),
      empresa VARCHAR(180),
      correo VARCHAR(180),
      celular VARCHAR(60),
      activo BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // Asegurar columna para forzar cambio de contraseña en primer login
  await query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS force_password_change BOOLEAN DEFAULT FALSE;
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS user_activity (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      username VARCHAR(64) NOT NULL,
      login_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      logout_time TIMESTAMP WITH TIME ZONE,
      duration_minutes INTEGER
    );
  `);
}

async function insertIfNotExists({ username, password, rol, nombre, nombreCompleto, cedula }) {
  const { rows } = await query('SELECT 1 FROM users WHERE username = $1 LIMIT 1', [username.toLowerCase()]);
  if (rows.length) return; // no sobrescribir si existe
  const hash = await bcrypt.hash(password, 10);
  await query(
    `INSERT INTO users (username, password_hash, rol, nombre, nombre_completo, cedula)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [username.toLowerCase(), hash, rol, nombre || null, nombreCompleto || null, cedula || null]
  );
}

async function bootMigrations() {
  try {
    await ensureSchema();
    await insertIfNotExists({
      username: 'admin',
      password: 'SupervisorIT2025',
      rol: 'admin',
      nombre: 'Administrador',
      nombreCompleto: 'Administrador del Sistema',
      cedula: 'E-00-0000-00000'
    });
    await insertIfNotExists({
      username: 'usuario',
      password: 'usuario123',
      rol: 'usuario',
      nombre: 'Usuario Estándar',
      nombreCompleto: 'Usuario Estándar',
      cedula: 'E-00-0000-00001'
    });
    console.log('DB schema ensured and minimal seed applied');
  } catch (err) {
    console.error('Migration/seed on boot failed:', err);
  }
}

bootMigrations();
