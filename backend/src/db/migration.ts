import * as path from 'path'
import { promises as fs } from 'fs'
import { Kysely, Migrator, PostgresDialect, FileMigrationProvider, SqliteDialect } from 'kysely'
import { run } from 'kysely-migration-cli'
import Database from 'better-sqlite3'

// For ESM environment
//const migrationFolder = new URL('../migrations', import.meta.url).pathname

// For CJS environment
const migrationFolder = path.join(__dirname, './migrations')
const dbFolder = path.join(__dirname, './db')

const db = new Kysely<any>({
  dialect: new SqliteDialect({
    database: new Database(`${dbFolder}/db.sqlite`)
  })
})

const migrator = new Migrator({
  db,
  provider: new FileMigrationProvider({
    fs,
    path,
    migrationFolder,
  }),
})

run(db, migrator, migrationFolder)