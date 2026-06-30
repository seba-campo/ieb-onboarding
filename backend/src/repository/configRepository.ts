import { db } from './db';

export const configRepository = {
  async getConfig(key: string): Promise<string | null> {
    const { rows } = await db.query(
      `SELECT value FROM system_configs WHERE key = $1`,
      [key]
    );
    return rows.length > 0 ? rows[0].value : null;
  },

  async getAllConfigs(): Promise<Record<string, string>> {
    const { rows } = await db.query(`SELECT key, value FROM system_configs ORDER BY key`);
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  },

  async setConfig(key: string, value: string): Promise<void> {
    await db.query(
      `INSERT INTO system_configs (key, value, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [key, value]
    );
  },
};
