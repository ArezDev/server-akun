import { Server } from 'socket.io';
import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const socket = res.socket;

  // Check if socket is not null
  if (!socket) {
    res.status(500).json({ success: false, message: 'Socket tidak tersedia' });
    return;
  }

  // Type assertion to tell TypeScript that socket is not null
  const anySocket = socket as any;

  if (!anySocket.server.io) {
    console.log('Memulai WebSocket server');

    const io = new Server(anySocket.server, {
      path: '/api/socket', // Set path for WebSocket server
    });

    io.on('connection', (socket) => {
      console.log('Client terhubung');

      socket.on('message', (msg) => {
        console.log('Pesan diterima:', msg);

        // Send message to all connected clients
        io.emit('message', msg);
      });

      socket.on('disconnect', () => {
        console.log('Client terputus');
      });
    });

    anySocket.server.io = io;
  } else {
    console.log('WebSocket server sudah berjalan');
  }

  res.end();
}