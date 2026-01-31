import { Router } from 'express';
import { getPlatformStats } from '../controllers/statsController';

const router = Router();

router.get('/platform', getPlatformStats);

export default router;

