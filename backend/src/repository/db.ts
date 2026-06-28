import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

const { Pool } = pg;

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL variable is missing. Check your .env file.');
}

// Configuración del Pool optimizado para el Transaction Pooler de Neon
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: true,
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000, // !!! Tiempo límite para obtener una conexión del pooler antes de fallar
});

export const db = {
  query: (text: string, params?: any[]): Promise<pg.QueryResult> => {
    return pool.query(text, params);
  },

  /**
   * CRÍTICO: Debe usarse obligatoriamente para transacciones complejas (BEGIN, COMMIT, ROLLBACK)
   * o para el bloqueo de filas concurrente (SKIP LOCKED), asegurando liberar el cliente al terminar.
   */
  connect: (): Promise<pg.PoolClient> => {
    return pool.connect();
  },
};
