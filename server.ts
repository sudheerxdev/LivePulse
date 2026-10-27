import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { app } from './backend/app.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  const httpServer = http.createServer(app);

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH', 'DELETE']
    }
  });

  // Attach io to express app so routes can broadcast
  app.set('io', io);

  // Track room counts and manage room join/leave
  io.on('connection', (socket) => {
    let currentRoom: string | null = null;

    socket.on('join-room', (sessionCode: string) => {
      const code = (sessionCode || '').toUpperCase().trim();
      if (!code) return;

      if (currentRoom && currentRoom !== code) {
        socket.leave(currentRoom);
      }

      currentRoom = code;
      socket.join(code);

      // Broadcast room participant count
      const room = io.sockets.adapter.rooms.get(code);
      const count = room ? room.size : 1;
      io.to(code).emit('audience:count', { count });
    });

    socket.on('leave-room', (sessionCode: string) => {
      const code = (sessionCode || '').toUpperCase().trim();
      socket.leave(code);
      const room = io.sockets.adapter.rooms.get(code);
      const count = room ? room.size : 0;
      io.to(code).emit('audience:count', { count });
      if (currentRoom === code) currentRoom = null;
    });

    socket.on('disconnect', () => {
      if (currentRoom) {
        const room = io.sockets.adapter.rooms.get(currentRoom);
        const count = room ? room.size : 0;
        io.to(currentRoom).emit('audience:count', { count });
      }
    });
  });

  // Vite integration
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`LivePulse server listening on http://localhost:${PORT}`);
  });
}

startServer();
