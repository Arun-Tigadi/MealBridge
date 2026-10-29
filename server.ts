import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import { connectDB } from './server/config/db.ts';
import { setSocketServer } from './server/services/notificationService.ts';
import apiRouter from './server/routes/api.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;
  const server = http.createServer(app);

  // Initialize Socket.IO
  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    },
  });

  setSocketServer(io);

  io.on('connection', (socket) => {
    // Client can join room for specific user ID or role
    socket.on('join_user', (userId: string) => {
      if (userId) socket.join(`user:${userId}`);
    });

    socket.on('join_role', (role: string) => {
      if (role) socket.join(`role:${role}`);
    });
  });

  // Connect to Database
  await connectDB();

  // Basic Middlewares
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logger for API calls
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`[API] ${req.method} ${req.path}`);
    }
    next();
  });

  // Mount API routes
  app.use('/api', apiRouter);

  // Vite middleware for development or Static files for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`MealBridge Server running on http://0.0.0.0:${PORT} (Belagavi region)`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start MealBridge server:', err);
});
