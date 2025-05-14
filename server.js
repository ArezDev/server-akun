// server.js
import { createServer } from 'http';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => handle(req, res));
  // Membuat instance Socket.IO
  const io = new SocketIOServer(server, {
    cors: {
      origin: "*",  // Atur sesuai domain frontend jika perlu
      methods: ["GET", "POST"],
    },
  });
  
  server.io = io;

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    // Simpan instance io di server untuk diakses di API Routes

    socket.on('message', (msg) => {
      console.log('Received message:', msg);
      io.emit('message', msg);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  server.listen(3000, (err) => {
    if (err) throw err;
    console.log('Websocket> Ready on http://localhost:3000');
  });
});
