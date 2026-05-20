import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { prisma } from '../prisma/client';

export const sendAdvisorRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ownerId = req.user!.userId;
    const { projectId, advisorId, message } = req.body;

    if (!projectId || !advisorId) {
      res.status(400).json({ error: 'Project ID and Advisor ID are required' });
      return;
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    if (project.ownerId !== ownerId) {
      res.status(403).json({ error: 'Only the project owner can request an advisor' });
      return;
    }

    if (project.advisorId) {
      res.status(400).json({ error: 'Project already has an advisor' });
      return;
    }

    // Verify advisor exists and is actually an INSTRUCTOR
    const advisor = await prisma.user.findFirst({
      where: { id: advisorId, role: 'INSTRUCTOR' }
    });

    if (!advisor) {
      res.status(404).json({ error: 'Advisor not found or is not an instructor' });
      return;
    }

    // Prevent duplicate requests to the same advisor
    const existingRequest = await prisma.advisorRequest.findUnique({
      where: { projectId_advisorId: { projectId, advisorId } }
    });

    if (existingRequest) {
      res.status(400).json({ error: 'Request already sent to this advisor' });
      return;
    }

    const request = await prisma.advisorRequest.create({
      data: {
        projectId,
        advisorId,
        message
      }
    });

    res.status(201).json({ message: 'Advisor request sent successfully', request });
  } catch (error) {
    console.error('Error sending advisor request:', error);
    res.status(500).json({ error: 'Failed to send advisor request' });
  }
};

export const respondToAdvisorRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const advisorId = req.user!.userId;
    const { requestId } = req.params;
    const { status } = req.body; // 'ACCEPTED' | 'REJECTED'

    if (!['ACCEPTED', 'REJECTED'].includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    const advisorRequest = await prisma.advisorRequest.findUnique({
      where: { id: requestId }
    });

    if (!advisorRequest) {
      res.status(404).json({ error: 'Request not found' });
      return;
    }

    if (advisorRequest.advisorId !== advisorId) {
      res.status(403).json({ error: 'You can only respond to your own requests' });
      return;
    }

    if (advisorRequest.status !== 'PENDING') {
      res.status(400).json({ error: 'Request has already been processed' });
      return;
    }

    await prisma.$transaction(async (tx) => {
      // Update request status
      await tx.advisorRequest.update({
        where: { id: requestId },
        data: { status }
      });

      if (status === 'ACCEPTED') {
        // Update project with this advisor and change status
        await tx.project.update({
          where: { id: advisorRequest.projectId },
          data: {
            advisorId: advisorId,
            status: 'ADVISOR_ASSIGNED'
          }
        });

        // Automatically reject other pending requests for this project to prevent multiple advisors
        await tx.advisorRequest.updateMany({
          where: {
            projectId: advisorRequest.projectId,
            status: 'PENDING',
            id: { not: requestId }
          },
          data: { status: 'REJECTED' }
        });
      }
    });

    res.status(200).json({ message: `Advisor request ${status.toLowerCase()} successfully` });
  } catch (error) {
    console.error('Error responding to advisor request:', error);
    res.status(500).json({ error: 'Failed to respond to advisor request' });
  }
};

/**
 * GET /api/advisors
 * Lists every INSTRUCTOR user with their advisor profile included so the
 * student "Find Advisor" page can render the directory in one round-trip.
 */
export const listAdvisors = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const advisors = await prisma.user.findMany({
      where: { role: 'INSTRUCTOR', status: 'ACTIVE' },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        advisorProfile: {
          select: {
            title: true,
            department: true,
            isAvailable: true,
            expertise: true,
            researchInterests: true,
          }
        }
      }
    });
    res.status(200).json({ advisors });
  } catch (error) {
    console.error('Error listing advisors:', error);
    res.status(500).json({ error: 'Failed to list advisors' });
  }
};

/**
 * GET /api/advisors/requests
 * Lists every AdvisorRequest addressed to the calling instructor, with the
 * underlying project + owner + team members included so the dashboard can
 * render incoming requests without extra round-trips.
 */
export const getMyAdvisorRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const advisorId = req.user!.userId;

    const requests = await prisma.advisorRequest.findMany({
      where: { advisorId },
      orderBy: { createdAt: 'desc' },
      include: {
        project: {
          include: {
            category: true,
            owner: { select: { id: true, name: true, email: true } },
            teamMembers: {
              include: { user: { select: { id: true, name: true, email: true } } }
            },
            teamAd: true,
          }
        }
      }
    });

    res.status(200).json({ requests });
  } catch (error) {
    console.error('Error fetching advisor requests:', error);
    res.status(500).json({ error: 'Failed to fetch advisor requests' });
  }
};
