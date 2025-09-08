import { Server } from 'socket.io';

class SocketService {
  private io: Server | null = null;

  setIO(ioInstance: Server) {
    this.io = ioInstance;
  }

  getIO(): Server | null {
    return this.io;
  }

  emitNewLogs(logs: any[]) {
    if (this.io) {
      this.io.emit('newLogs', logs);
    }
  }

  emitLogStats(stats: any) {
    if (this.io) {
      this.io.emit('logStats', stats);
    }
  }
}

export const socketService = new SocketService();
