import * as path from 'path';
import { promises as fs } from 'fs';
import { Kysely, Migrator, PostgresDialect, FileMigrationProvider, SqliteDialect } from 'kysely';
import { run } from 'kysely-migration-cli';
import Database from 'better-sqlite3';

// For ESM environment
//const migrationFolder = new URL('../migrations', import.meta.url).pathname

// For CJS environment
const migrationFolder = path.join(__dirname, './migrations');

const dbPath = process.env.DB_PATH || path.join(__dirname, './db/db.sqlite');
const dbFolder = path.dirname(dbPath);

async function ensureDbDirectory() {
  try {
    await fs.access(dbFolder);
  } catch {
    await fs.mkdir(dbFolder, { recursive: true });
    console.log('Created database directory:', dbFolder);
  }
}

async function initializeDatabase() {
  try {
    await ensureDbDirectory();

    const db = new Kysely<any>({
      dialect: new SqliteDialect({
        database: new Database(dbPath)
      })
    });

    const migrator = new Migrator({
      db,
      provider: new FileMigrationProvider({
        fs,
        path,
        migrationFolder
      })
    });

    const { error, results } = await migrator.migrateToLatest();

    if (error) {
      console.error('Migration failed:', error);
      throw error;
    }

    if (results && results.length > 0) {
      console.log('Migrations applied:');
      results.forEach((result) => {
        console.log(`- ${result.migrationName}: ${result.status}`);
      });
    } else {
      console.log('Database is up to date');
    }

    await db.destroy();
    return true;
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

export { initializeDatabase };

// Not tested yet. Just some copied StackOverflow code
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    initializeDatabase()
      .then(() => {
        console.log('Database initialization completed successfully');
        process.exit(0);
      })
      .catch((error) => {
        console.error('Database initialization failed:', error);
        process.exit(1);
      });
  } else {
    const db = new Kysely<any>({
      dialect: new SqliteDialect({
        database: new Database(dbPath)
      })
    });

    const migrator = new Migrator({
      db,
      provider: new FileMigrationProvider({
        fs,
        path,
        migrationFolder
      })
    });

    run(db, migrator, migrationFolder);
  }
}
