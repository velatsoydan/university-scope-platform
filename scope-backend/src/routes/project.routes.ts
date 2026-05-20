import { Router } from 'express';
import {
  createProject,
  getAllProjects,
  getMyProjects,
  getAdvisedProjects,
  updateProject,
  deleteProject,
  leaveProject,
  removeTeamMember,
  updateTeamMemberRole,
  publishTeamAd,
  unpublishTeamAd,
} from '../controllers/project.controller';
import { verifyToken, requireRole } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createProjectSchema, updateProjectSchema } from '../validators/project.validator';

const router = Router();

router.use(verifyToken);

// Listing / creation
router.post('/', requireRole(['STUDENT']), validate(createProjectSchema), createProject);
router.get('/', requireRole(['STUDENT', 'INSTRUCTOR', 'ADMIN']), getAllProjects);
router.get('/my-projects', requireRole(['STUDENT']), getMyProjects);
router.get('/advised', requireRole(['INSTRUCTOR']), getAdvisedProjects);

// Single-project mutations — ownership/membership is enforced inside controllers
router.put('/:id', requireRole(['STUDENT']), validate(updateProjectSchema), updateProject);
router.delete('/:id', requireRole(['STUDENT']), deleteProject);

// Team-member management
router.post('/:id/leave', requireRole(['STUDENT']), leaveProject);
router.delete('/:id/members/:userId', requireRole(['STUDENT']), removeTeamMember);
router.put('/:id/members/:userId', requireRole(['STUDENT']), updateTeamMemberRole);

// Team Ad publishing — make the project visible on the public Team Ads feed
router.post('/:id/team-ad', requireRole(['STUDENT']), publishTeamAd);
router.delete('/:id/team-ad', requireRole(['STUDENT']), unpublishTeamAd);

export default router;
