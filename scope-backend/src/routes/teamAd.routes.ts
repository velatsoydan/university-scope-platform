import { Router } from 'express';
import { listTeamAds } from '../controllers/teamAd.controller';
import { verifyToken, requireRole } from '../middlewares/auth.middleware';

const router = Router();

router.use(verifyToken);

// Students browse team ads to find projects they can join
router.get('/', requireRole(['STUDENT', 'INSTRUCTOR', 'ADMIN']), listTeamAds);

export default router;
