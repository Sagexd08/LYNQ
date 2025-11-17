import { Application } from 'express';
import { Server } from 'socket.io';
import loanRoutes from './loans';
import userRoutes from './users';
import notificationRoutes from './notifications';
import statsRoutes from './stats';
import flashLoanRoutes from './flashLoans';
import aiRoutes from './ai';
import telegramRoutes from './telegram';

export const setupRoutes = (app: Application, io: Server) => {
  app.use('/api/v1/loans', loanRoutes(io));
  app.use('/api/v1/users', userRoutes);
  app.use('/api/v1/notifications', notificationRoutes);
  app.use('/api/v1/stats', statsRoutes);
  app.use('/api/v1/flash-loans', flashLoanRoutes);
  app.use('/api/v1/ai', aiRoutes);
  app.use('/api/v1/telegram', telegramRoutes);
};

