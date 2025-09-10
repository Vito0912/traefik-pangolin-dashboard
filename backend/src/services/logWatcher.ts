import * as fs from 'fs';
import * as path from 'path';
import { sql } from 'kysely';
import db from '../db/db';
import { socketService } from './socketService';
import type { LogEntry } from '../types/apiResponses';

class LogWatcher {
  private logPath = path.join(process.cwd(), 'logs', 'access.log');
  private batch: LogEntry[] = [];
  private lastPosition = 0;
  private watcher: fs.FSWatcher | null = null;

  async start() {
    await this.loadExistingLogs();
    this.startBatchProcessor();
    this.watchFile();
  }

  private async loadExistingLogs() {
    if (!fs.existsSync(this.logPath)) return;

    const lastLog = await db.selectFrom('logs').select('time').orderBy('time', 'desc').limit(1).executeTakeFirst();

    const lastTimestamp = lastLog?.time ? new Date(lastLog.time) : new Date(0);

    const stream = fs.createReadStream(this.logPath, { encoding: 'utf8' });
    let buffer = '';
    const newLogs: LogEntry[] = [];

    stream.on('data', (chunk) => {
      buffer += chunk;
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          try {
            const entry = JSON.parse(line) as LogEntry;
            if (new Date(entry.time) > lastTimestamp) {
              newLogs.push(entry);
            }
          } catch {}
        }
      }
    });

    stream.on('end', async () => {
      if (buffer.trim()) {
        try {
          const entry = JSON.parse(buffer) as LogEntry;
          if (new Date(entry.time) > lastTimestamp) {
            newLogs.push(entry);
          }
        } catch {}
      }

      if (newLogs.length > 0) {
        await this.insertLogsInChunks(newLogs);
      }

      this.lastPosition = fs.statSync(this.logPath).size;
    });

    return new Promise<void>((resolve) => stream.on('close', () => resolve()));
  }

  private watchFile() {
    if (!fs.existsSync(this.logPath)) {
      console.warn(`Log file not found at ${this.logPath}, retrying in 1s...`);
      setTimeout(() => this.watchFile(), 1000);
      return;
    }

    this.watcher = fs.watch(this.logPath, () => {
      this.readNewLines();
    });
  }

  private readNewLines() {
    const stats = fs.statSync(this.logPath);
    if (stats.size <= this.lastPosition) return;

    const stream = fs.createReadStream(this.logPath, {
      start: this.lastPosition,
      encoding: 'utf8'
    });

    let buffer = '';
    stream.on('data', (chunk) => {
      buffer += chunk;
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          try {
            this.batch.push(JSON.parse(line) as LogEntry);
          } catch {}
        }
      }
    });

    stream.on('end', () => {
      this.lastPosition = stats.size;
    });
  }

  private startBatchProcessor() {
    setInterval(async () => {
      const entries = this.batch.splice(0);

      try {
        await this.insertLogsInChunks(entries);
      } catch (error) {
        console.error('Failed to insert logs:', error);
        this.batch.unshift(...entries);
      }
    }, 1000);
  }

  private async insertLogsInChunks(entries: LogEntry[]) {
    if (process.env.NODE_ENV !== 'production') {
      const randomLogs = await db
        .selectFrom('logs')
        .selectAll()
        .orderBy(sql`random()`)
        .limit(Math.round(Math.random() * 10))
        .execute();
      socketService.emitNewLogs(randomLogs);
    }
    if (entries.length === 0) return;

    const chunkSize = 100;
    let processed = 0;

    const dbEntries = entries.map((entry) => ({
      time: entry.time,
      ClientHost: entry.ClientHost,
      DownstreamContentSize: entry.DownstreamContentSize,
      DownstreamStatus: entry.DownstreamStatus,
      Duration: entry.Duration.toString(),
      RequestMethod: entry.RequestMethod,
      RequestPath: entry.RequestPath || null,
      ServiceName: entry.ServiceName || null,
      StartUTC: entry.StartUTC,
      'request_User-Agent': entry['request_User-Agent'] || null,
      'request_X-Forwarded-Proto': entry['request_X-Forwarded-Proto'] || null,
      RetryAttempts: entry.RetryAttempts.toString()
    }));

    for (let i = 0; i < dbEntries.length; i += chunkSize) {
      const chunk = dbEntries.slice(i, i + chunkSize);

      socketService.emitNewLogs(chunk);

      await db.insertInto('logs').values(chunk).execute();

      processed += chunk.length;
      if (processed % 1000 === 0) {
        console.log(`Processed ${processed}/${dbEntries.length} logs`);
      }
    }
  }

  stop() {
    this.watcher?.close();
  }
}

export const logWatcher = new LogWatcher();
