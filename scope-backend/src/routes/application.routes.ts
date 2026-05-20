import { Router } from 'express';
import {
  applyForProject,
  getMyApplications,
  getIncomingApplications,
  withdrawApplication,
  respondToApplication,
} from '../controllers/application.controller';
import { verifyToken, requireRole } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { applyToProjectSchema, updateApplicationStatusSchema } from '../validators/application.validator';

const router = Router();

router.use(verifyToken);

// Only students can submit applications
router.post('/apply', requireRole(['STUDENT']), validate(applyToProjectSchema), applyForProject);

// Student lists their own outgoing applications
router.get('/mine', requireRole(['STUDENT']), getMyApplications);

// Student lists applications to projects they own
router.get('/incoming', requireRole(['STUDENT']), getIncomingApplications);

// Student withdraws their own pending application
router.delete('/:applicationId', requireRole(['STUDENT']), withdrawApplication);

// Project owner (any authenticated user) responds to applications — ownership is validated in controller
router.put('/:applicationId/respond', validate(updateApplicationStatusSchema), respondToApplication);

export default router;
