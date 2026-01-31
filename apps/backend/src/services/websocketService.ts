import { Server } from 'socket.io';
import logger from '../utils/logger';

class WebSocketService {
  private io: Server | null = null;

  initialize(io: Server) {
    this.io = io;
    this.setupEventHandlers();
    logger.info('WebSocket service initialized');
  }

  private setupEventHandlers() {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      logger.info('Client connected', { socketId: socket.id });

      socket.on('subscribe', (walletAddress: string) => {
        socket.join(`wallet:${walletAddress}`);
        logger.info('Client subscribed', { socketId: socket.id, walletAddress });
        socket.emit('subscribed', { walletAddress });
      });

      socket.on('unsubscribe', (walletAddress: string) => {
        socket.leave(`wallet:${walletAddress}`);
        logger.info('Client unsubscribed', { socketId: socket.id, walletAddress });
      });

      socket.on('disconnect', () => {
        logger.info('Client disconnected', { socketId: socket.id });
      });
    });
  }

  emitToWallet(walletAddress: string, event: string, data: any) {
    if (!this.io) {
      logger.warn('WebSocket server not initialized');
      return;
    }

    this.io.to(`wallet:${walletAddress}`).emit(event, data);
    logger.info('Emitted event to wallet', { walletAddress, event });
  }

  emitLoanUpdate(walletAddress: string, loan: any) {
    this.emitToWallet(walletAddress, 'loan_updated', loan);
  }

  emitPaymentReceived(walletAddress: string, payment: any) {
    this.emitToWallet(walletAddress, 'payment_received', payment);
  }

  emitLoanOverdue(walletAddress: string, loan: any) {
    this.emitToWallet(walletAddress, 'loan_overdue', loan);
  }

  emitTrustScoreUpdate(walletAddress: string, trustScore: any) {
    this.emitToWallet(walletAddress, 'trust_score_updated', trustScore);
  }
}

export const webSocketService = new WebSocketService();

