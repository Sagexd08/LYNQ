import { Router } from 'express';
import { Server } from 'socket.io';
import { getLoansByUser, getLoanById, createLoan, updateLoanStatus } from '../controllers/loanController';
import { authenticate } from '../middleware/auth';

const loanRoutes = (io: Server) => {
  const router = Router();

  router.get('/user/:walletAddress', authenticate, getLoansByUser);
  router.get('/:loanId', authenticate, getLoanById);
  router.post('/', authenticate, createLoan);
  router.patch('/:loanId/status', authenticate, updateLoanStatus);

  return router;
};

export default loanRoutes;

