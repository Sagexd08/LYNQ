import { Router } from 'express';
import { getUserByWallet, updateUser, getTrustScore } from '../controllers/userController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/:walletAddress', authenticate, getUserByWallet);
router.put('/:walletAddress', authenticate, updateUser);
router.get('/:walletAddress/trust-score', authenticate, getTrustScore);

export default router;

