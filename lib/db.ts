import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST || '82.197.82.133',
      user: process.env.MYSQL_USER || 'u533650113_black',
      password: process.env.MYSQL_PASSWORD || 'Juan159159@',
      database: process.env.MYSQL_DATABASE || 'u533650113_black',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return pool;
}

export async function query<T = any>(sql: string, params?: any[]): Promise<T> {
  const pool = getPool();
  const [rows] = await pool.execute(sql, params);
  return rows as T;
}
