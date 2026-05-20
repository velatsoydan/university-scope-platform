import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { prisma } from '../prisma/client';

/**
 * GET /api/team-ads
 * Lists every open team ad the current student can browse. Excludes ads on:
 *  - completed projects
 *  - projects the student already owns
 *  - projects the student is already a team member of
 *
 * Each result also includes the student's own application (if any) to the
 * underlying project, so the UI can render an "Applied" badge without a
 * second round-trip.
 */
export const listTeamAds = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const teamAds = await prisma.teamAd.findMany({
      where: {
        project: {
          status: { not: 'COMPLETED' },
          ownerId: { not: userId },
          teamMembers: { none: { userId } },
        }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, name: true } },
        project: {
          select: {
            id: true,
            status: true,
            category: { select: { id: true, name: true } },
            _count: { select: { teamMembers: true } },
            applications: {
              where: { studentId: userId },
              select: { id: true, status: true },
            },
          }
        }
      }
    });

    res.status(200).json({ teamAds });
  } catch (error) {
    console.error('Error listing team ads:', error);
    res.status(500).json({ error: 'Failed to list team ads' });
  }
};
