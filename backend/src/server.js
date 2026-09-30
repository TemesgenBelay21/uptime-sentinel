require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { connectDB } = require('./config/db');
const socketService = require('./services/socket');
const { startScheduler } = require('./services/scheduler');

const PORT = process.env.PORT || 5000;

const start = async () => {
  // 1. Connect to MySQL and ensure application tables exist
  await connectDB();

  // 2. Create HTTP server + attach Socket.io
  const httpServer = http.createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // 3. Initialize socket service
  socketService.init(io);

  // 4. Start the background scheduler
  startScheduler();

  // 5. Start listening
  httpServer.listen(PORT, () => {
    console.log(`🚀 Uptime Sentinel API running on http://localhost:${PORT}`);
  });
};

start().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
