import pkg from 'pg';
const { Pool } = pkg;

const connectionString = process.env.DATABASE_URL;

export const pool = new Pool({
  connectionString,
  ssl: process.env.PGSSL ? { rejectUnauthorized: false } : undefined
});

export async function query(text, params) {
  const res = await pool.query(text, params);
  return res;
}
