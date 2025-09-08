import { type Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {

    await db.schema
        .createTable('logs')
        .ifNotExists()
        .addColumn('time', 'timestamp', col => col.notNull())
        .addColumn('id', 'integer', col => col.primaryKey().autoIncrement())
        .addColumn('ClientHost', 'varchar(39)', col => col.notNull())
        .addColumn('DownstreamContentSize', 'integer', col => col.notNull())
        .addColumn('DownstreamStatus', 'integer', col => col.notNull())
        .addColumn('Duration', 'bigint', col => col.notNull())
        .addColumn('RequestMethod', 'varchar(20)', col => col.notNull())
        .addColumn('RequestPath', 'text')
        .addColumn('ServiceName', 'varchar(120)')
        .addColumn('StartUTC', 'timestamp', col => col.notNull())
        .addColumn('request_User-Agent', 'text')
        .addColumn('request_X-Forwarded-Proto', 'varchar(20)')
        .addColumn('RetryAttempts', 'smallint', col => col.notNull())
        .execute()


    // Indexes
    await db.schema
        .createIndex('idx_logs_ClientHost')
        .ifNotExists()
        .on('logs')
        .column('ClientHost')
        .execute()

    await db.schema
        .createIndex('idx_logs_DownstreamStatus')
        .ifNotExists()
        .on('logs')
        .column('DownstreamStatus')
        .execute()

    await db.schema
        .createIndex('idx_logs_RequestMethod')
        .ifNotExists()
        .on('logs')
        .column('RequestMethod')
        .execute()

    await db.schema
        .createIndex('idx_logs_ServiceName')
        .ifNotExists()
        .on('logs')
        .column('ServiceName')
        .execute()

    await db.schema
        .createIndex('idx_logs_StartUTC')
        .ifNotExists()
        .on('logs')
        .column('StartUTC')
        .execute()

    await db.schema
        .createIndex('idx_logs_time')
        .ifNotExists()
        .on('logs')
        .column('time')
        .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
    await db.schema
        .dropTable('logs')
        .ifExists()
        .execute()
}
