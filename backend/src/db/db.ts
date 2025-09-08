import * as path from 'path'
import { Kysely,SqliteDialect } from 'kysely'
import Database from 'better-sqlite3'

const dbFolder = path.join(__dirname, './db')

const db = new Kysely<any>({
  dialect: new SqliteDialect({
    database: new Database(`${dbFolder}/db.sqlite`)
  })
})

export default db