import * as path from 'path';
import { Kysely, SqliteDialect } from 'kysely';
import Database from 'better-sqlite3';

const dbPath = process.env.DB_PATH || path.join(__dirname, './db/db.sqlite');

import { promises as fs } from 'fs';
const dbDir = path.dirname(dbPath);

async function ensureDbDir() {
  try {
    await fs.access(dbDir);
  } catch {
    await fs.mkdir(dbDir, { recursive: true });
  }
}

try {
  require('fs').mkdirSync(dbDir, { recursive: true });
} catch (e) {}

const db = new Kysely<any>({
  dialect: new SqliteDialect({
    database: new Database(dbPath)
  })
});

export default db;
