import * as fs from 'fs'
import * as path from 'path'
import db from '../db/db'
import { socketService } from './socketService'

interface LogEntry {
  ClientAddr?: string
  ClientHost: string
  DownstreamContentSize: number
  DownstreamStatus: number
  Duration: number
  RequestMethod: string
  RequestPath?: string
  RequestProtocol?: string
  RetryAttempts: number
  ServiceName?: string
  StartUTC: string
  TLSCipher?: string
  TLSVersion?: string
  'downstream_Content-Type'?: string
  level?: string
  msg?: string
  'origin_Content-Type'?: string
  'request_User-Agent'?: string
  'request_X-Forwarded-Proto'?: string
  'request_X-Real-Ip'?: string
  time: string
}

class LogWatcher {
  private logPath = path.join(process.cwd(), 'logs', 'access.log')
  private batch: LogEntry[] = []
  private lastPosition = 0
  private watcher?: fs.FSWatcher

  async start() {
    await this.loadExistingLogs()
    this.startBatchProcessor()
    this.watchFile()
  }

  private async loadExistingLogs() {
    if (!fs.existsSync(this.logPath)) return

    const lastLog = await db
      .selectFrom('logs')
      .select('time')
      .orderBy('time', 'desc')
      .limit(1)
      .executeTakeFirst()

    const lastTimestamp = lastLog?.time ? new Date(lastLog.time) : new Date(0)
    
    const stream = fs.createReadStream(this.logPath, { encoding: 'utf8' })
    let buffer = ''
    const newLogs: LogEntry[] = []
    
    stream.on('data', chunk => {
      buffer += chunk
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      
      for (const line of lines) {
        if (line.trim()) {
          try {
            const entry = JSON.parse(line) as LogEntry
            if (new Date(entry.time) > lastTimestamp) {
              newLogs.push(entry)
            }
          } catch {}
        }
      }
    })

    stream.on('end', async () => {
      if (buffer.trim()) {
        try {
          const entry = JSON.parse(buffer) as LogEntry
          if (new Date(entry.time) > lastTimestamp) {
            newLogs.push(entry)
          }
        } catch {}
      }
      
      if (newLogs.length > 0) {
        await this.insertLogsInChunks(newLogs)
      }
      
      this.lastPosition = fs.statSync(this.logPath).size
    })

    return new Promise<void>(resolve => stream.on('close', () => resolve()))
  }

  private watchFile() {
    if (!fs.existsSync(this.logPath)) {
        console.warn(`Log file not found at ${this.logPath}, retrying in 1s...`)
      setTimeout(() => this.watchFile(), 1000)
      return
    }

    this.watcher = fs.watch(this.logPath, () => {
      this.readNewLines()
    })
  }

  private readNewLines() {
    const stats = fs.statSync(this.logPath)
    if (stats.size <= this.lastPosition) return

    const stream = fs.createReadStream(this.logPath, {
      start: this.lastPosition,
      encoding: 'utf8'
    })

    let buffer = ''
    stream.on('data', chunk => {
      buffer += chunk
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      
      for (const line of lines) {
        if (line.trim()) {
          try {
            this.batch.push(JSON.parse(line) as LogEntry)
          } catch {}
        }
      }
    })

    stream.on('end', () => {
      this.lastPosition = stats.size
    })
  }

  private startBatchProcessor() {
    setInterval(async () => {
      if (this.batch.length === 0) return

      const entries = this.batch.splice(0)
      
      try {
        await this.insertLogsInChunks(entries)
      } catch (error) {
        console.error('Failed to insert logs:', error)
        this.batch.unshift(...entries)
      }
    }, 1000)
  }

  private async insertLogsInChunks(entries: LogEntry[]) {

    // if in development mode, add random new logs
    if (process.env.NODE_ENV === 'development') {
      for (let i = 0; i < 5; i++) {
        const randomLogs = await db.selectFrom('logs').selectAll().orderBy(`random()`).limit(5).execute()
        
        // @ts-ignore
        entries.push(...randomLogs)
      }
    }

    const chunkSize = 100
    let processed = 0
    
    const dbEntries = entries.map(entry => ({
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
      const chunk = dbEntries.slice(i, i + chunkSize)

      socketService.emitNewLogs(chunk)

      await db
        .insertInto('logs')
        .values(chunk)
        .execute()
      
      processed += chunk.length
      if (processed % 1000 === 0 || processed === dbEntries.length) {
        console.log(`Processed ${processed}/${dbEntries.length} logs`)
      }
    }
    
    socketService.emitNewLogs(dbEntries);
  }

  stop() {
    this.watcher?.close()
  }
}

export const logWatcher = new LogWatcher()