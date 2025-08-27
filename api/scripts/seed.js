import 'dotenv/config';
import bcrypt from 'bcrypt';
import { query } from '../db.js';

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

async function upsertUser({ username, password, rol, nombre, nombreCompleto, cedula, area, empresa, correo, celular }) {
  const hash = await bcrypt.hash(password, 10);
  await query(
    `INSERT INTO users (username, password_hash, rol, nombre, nombre_completo, cedula, area, empresa, correo, celular)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     ON CONFLICT (username) DO UPDATE SET
       password_hash = EXCLUDED.password_hash,
       rol = EXCLUDED.rol,
       nombre = EXCLUDED.nombre,
       nombre_completo = EXCLUDED.nombre_completo,
       cedula = EXCLUDED.cedula,
       area = EXCLUDED.area,
       empresa = EXCLUDED.empresa,
       correo = EXCLUDED.correo,
       celular = EXCLUDED.celular`,
    [username.toLowerCase(), hash, rol, nombre || null, nombreCompleto || null, cedula || null, area || null, empresa || null, correo || null, celular || null]
  );
}

async function main() {
  await ensureSchema();
  await upsertUser({
    username: 'admin',
    password: 'SupervisorIT2025',
    rol: 'admin',
    nombre: 'Administrador',
    nombreCompleto: 'Administrador del Sistema',
    cedula: 'E-00-0000-00000'
  });
  await upsertUser({
    username: 'usuario',
    password: 'usuario123',
    rol: 'usuario',
    nombre: 'Usuario Estándar',
    nombreCompleto: 'Usuario Estándar',
    cedula: 'E-00-0000-00001'
  });
  console.log('Seed completado');
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
