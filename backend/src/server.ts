import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import logger from './utils/logger';
import errorHandler from './middleware/errorHandler';
import rateLimiter from './middleware/rateLimiter';
import { setupRoutes } from './routes';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(rateLimiter);

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Routes
setupRoutes(app, io);

// Error handling
app.use(errorHandler);

// WebSocket connection handling
io.on('connection', (socket) => {
  logger.info('Client connected', { socketId: socket.id });

  socket.on('subscribe', (walletAddress: string) => {
    socket.join(`wallet:${walletAddress}`);
    logger.info('Client subscribed to wallet updates', { socketId: socket.id, walletAddress });
  });

  socket.on('unsubscribe', (walletAddress: string) => {
    socket.leave(`wallet:${walletAddress}`);
    logger.info('Client unsubscribed from wallet updates', { socketId: socket.id, walletAddress });
  });

  socket.on('disconnect', () => {
    logger.info('Client disconnected', { socketId: socket.id });
  });
});

httpServer.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`, {
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
  });
});

export { io };
export default app;

