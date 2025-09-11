import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import logsRouter from './routes/logs';
import { logWatcher } from './services/logWatcher';
import { socketService } from './services/socketService';
import { initializeDatabase } from './db/migration';
var cors = require('cors');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

socketService.setIO(io);

app.use(express.json());

app.use(cors('*'));

const isDevelopment = process.env.NODE_ENV !== 'production';
const frontendPath = path.join(__dirname, '../../frontend/dist');

if (isDevelopment) {
  const { createProxyMiddleware } = require('http-proxy-middleware');

  const viteProxy = createProxyMiddleware({
    target: 'http://localhost:5173',
    changeOrigin: true,
    ws: true,
    pathFilter: (path: string) => {
      return !path.startsWith('/api') && !path.startsWith('/socket.io');
    }
  });

  app.use(viteProxy);
} else {
  app.use(express.static(frontendPath));
}

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/logs', logsRouter);

if (!isDevelopment) {
  app.get('{*any}', (_req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

const port = Number(process.env.PORT) || 3000;

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

async function startServer() {
  try {
    console.log('Initializing database...');
    await initializeDatabase();
    console.log('Database initialized successfully');

    const mode = isDevelopment ? 'development' : 'production';
    console.log(`Starting server in ${mode} mode...`);

    if (isDevelopment) {
      console.log('Frontend requests will be proxied to Vite dev server at http://localhost:5173');
      console.log('Make sure to start the frontend dev server: cd frontend && npm run dev');
    }

    server.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
      logWatcher.start();
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
