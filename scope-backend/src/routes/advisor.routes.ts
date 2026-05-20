import { Router } from 'express';
import {
  sendAdvisorRequest,
  respondToAdvisorRequest,
  getMyAdvisorRequests,
  listAdvisors,
} from '../controllers/advisor.controller';
import { verifyToken, requireRole } from '../middlewares/auth.middleware';

const router = Router();

router.use(verifyToken);

// Anyone authenticated can browse the advisor directory
router.get('/', requireRole(['STUDENT', 'INSTRUCTOR', 'ADMIN']), listAdvisors);

// Student requests an advisor for their project
router.post('/request', requireRole(['STUDENT']), sendAdvisorRequest);

// Instructor lists every advisor request addressed to them
router.get('/requests', requireRole(['INSTRUCTOR']), getMyAdvisorRequests);

// Instructor accepts/rejects a specific request
router.put('/:requestId/respond', requireRole(['INSTRUCTOR']), respondToAdvisorRequest);

export default router;
