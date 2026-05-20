import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { prisma } from '../prisma/client';

type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export const applyForProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const userRole = req.user!.role;
    const { projectId, requestedRoles } = req.body;

    if (userRole !== 'STUDENT') {
      res.status(403).json({ error: 'Only students can apply to projects' });
      return;
    }

    if (!projectId || !requestedRoles || requestedRoles.length === 0) {
      res.status(400).json({ error: 'Project ID and requested roles are required' });
      return;
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    if (project.ownerId === userId) {
      res.status(400).json({ error: 'You cannot apply to your own project' });
      return;
    }

    // Prevent duplicate applications to the exact same project
    const existingApp = await prisma.projectApplication.findUnique({
      where: { projectId_studentId: { projectId, studentId: userId } }
    });

    if (existingApp) {
      res.status(400).json({ error: 'You have already applied to this project' });
      return;
    }

    const application = await prisma.projectApplication.create({
      data: {
        projectId,
        studentId: userId,
        requestedRoles
      }
    });

    res.status(201).json({ message: 'Application submitted successfully', application });
  } catch (error) {
    console.error('Error applying for project:', error);
    res.status(500).json({ error: 'Failed to apply for project' });
  }
};

/**
 * GET /api/applications/mine
 * Lists every ProjectApplication submitted by the calling student, with the
 * underlying project, owner, category, and team-ad info included so the
 * "My Applications" page can render without extra round-trips.
 */
export const getMyApplications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const applications = await prisma.projectApplication.findMany({
      where: { studentId: userId },
      orderBy: { appliedAt: 'desc' },
      include: {
        project: {
          include: {
            category: true,
            owner: { select: { id: true, name: true, email: true } },
            teamAd: true,
            _count: { select: { teamMembers: true } },
          }
        }
      }
    });
    res.status(200).json({ applications });
  } catch (error) {
    console.error('Error fetching my applications:', error);
    res.status(500).json({ error: 'Failed to fetch your applications' });
  }
};

/**
 * GET /api/applications/incoming
 * Lists every ProjectApplication submitted to a project the calling student
 * owns, with the applicant + student profile embedded so the project owner
 * can review skills, interests and bio in a single round-trip.
 */
export const getIncomingApplications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const applications = await prisma.projectApplication.findMany({
      where: { project: { ownerId: userId } },
      orderBy: { appliedAt: 'desc' },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            category: { select: { id: true, name: true } },
          }
        },
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            studentProfile: {
              select: {
                technicalSkills: true,
                interests: true,
                bio: true,
                department: true,
                year: true,
              }
            }
          }
        }
      }
    });
    res.status(200).json({ applications });
  } catch (error) {
    console.error('Error fetching incoming applications:', error);
    res.status(500).json({ error: 'Failed to fetch incoming applications' });
  }
};

/**
 * DELETE /api/applications/:applicationId
 * The applicant cancels their own application. Only PENDING applications
 * can be withdrawn — once accepted/rejected, the record is preserved as audit.
 */
export const withdrawApplication = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { applicationId } = req.params;

    const application = await prisma.projectApplication.findUnique({
      where: { id: applicationId }
    });

    if (!application) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    if (application.studentId !== userId) {
      res.status(403).json({ error: 'You can only withdraw your own applications' });
      return;
    }

    if (application.status !== 'PENDING') {
      res.status(400).json({ error: 'Only pending applications can be withdrawn' });
      return;
    }

    await prisma.projectApplication.delete({ where: { id: applicationId } });
    res.status(200).json({ message: 'Application withdrawn successfully' });
  } catch (error) {
    console.error('Error withdrawing application:', error);
    res.status(500).json({ error: 'Failed to withdraw application' });
  }
};

export const respondToApplication = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ownerId = req.user!.userId;
    const { applicationId } = req.params;
    const { status, assignedRole } = req.body; // 'ACCEPTED' | 'REJECTED'

    if (!['ACCEPTED', 'REJECTED'].includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    const application = await prisma.projectApplication.findUnique({
      where: { id: applicationId },
      include: { project: true }
    });

    if (!application) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    if (application.project.ownerId !== ownerId) {
      res.status(403).json({ error: 'Only the project owner can respond to applications' });
      return;
    }

    if (application.status !== 'PENDING') {
      res.status(400).json({ error: 'Application has already been processed' });
      return;
    }

    if (status === 'ACCEPTED') {
      const currentMembers = await prisma.teamMember.count({
        where: { projectId: application.projectId }
      });
      if (currentMembers >= 4) {
        res.status(400).json({ error: 'Project has reached its maximum capacity of 4 members' });
        return;
      }

      // 1 Student = 1 Project: block acceptance if student is already an active team member
      const studentMembership = await prisma.teamMember.findFirst({
        where: { userId: application.studentId }
      });
      if (studentMembership) {
        res.status(400).json({ error: 'Student has already been accepted to another project' });
        return;
      }
    }

    await prisma.$transaction(async (tx: TxClient) => {
      // Update application status
      await tx.projectApplication.update({
        where: { id: applicationId },
        data: { status }
      });

      // If accepted, add applicant to the team
      if (status === 'ACCEPTED') {
        const role = assignedRole || application.requestedRoles[0] || 'Member';
        await tx.teamMember.create({
          data: {
            projectId: application.projectId,
            userId: application.studentId,
            role: role
          }
        });

        // 1 Student = 1 Project Rule: Reject other pending applications
        await tx.projectApplication.updateMany({
          where: {
            studentId: application.studentId,
            status: 'PENDING',
            id: { not: applicationId }
          },
          data: { status: 'REJECTED' }
        });
      }
    });

    res.status(200).json({ message: `Application ${status.toLowerCase()} successfully` });
  } catch (error) {
    console.error('Error responding to application:', error);
    res.status(500).json({ error: 'Failed to respond to application' });
  }
};
