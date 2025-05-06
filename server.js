const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Create HTTP server
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Initialize Socket.IO server
  const io = new Server(server, {
    cors: {
      origin: '*', // In production, restrict this to your domains
      methods: ['GET', 'POST'],
    },
    path: '/api/socket',
  });

  // Socket.IO connection handling
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);
    
    // Send welcome message
    socket.emit('welcome', { 
      message: 'Connected to KleanKuts Admin WebSocket Server',
      timestamp: new Date().toISOString(),
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  // Store the io instance globally for access from API routes
  global.io = io;
  
  // Start the server
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
    console.log(`> WebSocket server initialized on path: /api/socket`);
  });
});
