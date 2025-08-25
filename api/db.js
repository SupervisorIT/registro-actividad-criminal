import pkg from 'pg';
const { Pool } = pkg;

const connectionString = process.env.DATABASE_URL;

export const pool = new Pool({
  connectionString,
  ssl: process.env.PGSSL ? { rejectUnauthorized: false } : undefined,
  // Pool tuning: evita churn de conexiones y mejora estabilidad
  max: Number(process.env.PGPOOL_MAX || 10), // conexiones máximas
  idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT || 30000), // 30s antes de cerrar una idle
  connectionTimeoutMillis: Number(process.env.PG_CONN_TIMEOUT || 10000), // 10s para conectar
  keepAlive: true
});

export async function query(text, params) {
  const res = await pool.query(text, params);
  return res;
}
