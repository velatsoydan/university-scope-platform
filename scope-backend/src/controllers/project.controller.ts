import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { prisma } from '../prisma/client';

export const createProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { title, description, budget, requiredSkills, categoryId, teamAd } = req.body;

    if (!title || !description || !categoryId) {
      res.status(400).json({ error: 'Missing required project fields' });
      return;
    }

    const project = await prisma.$transaction(async (tx) => {
      // Create Project
      const newProject = await tx.project.create({
        data: {
          title,
          description,
          budget,
          requiredSkills: requiredSkills || [],
          categoryId,
          ownerId: userId,
          status: 'PENDING_ADVISOR',
        }
      });

      // Add owner as TeamMember
      await tx.teamMember.create({
        data: {
          projectId: newProject.id,
          userId: userId,
          role: 'Project Lead',
        }
      });

      // Create TeamAd if provided
      if (teamAd) {
        await tx.teamAd.create({
          data: {
            projectId: newProject.id,
            authorId: userId,
            title: title, // Use project title
            description: teamAd.description,
            fullDescription: teamAd.fullDescription,
            projectType: teamAd.projectType,
            technicalSkills: teamAd.technicalSkills || [],
            interests: teamAd.interests || [],
          }
        });
      }

      return newProject;
    });

    res.status(201).json({ message: 'Project created successfully', project });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
};

export const getAllProjects = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        category: true,
        advisor: {
          select: { id: true, name: true, email: true }
        },
        owner: {
          select: { id: true, name: true }
        },
        teamMembers: true,
        teamAd: true
      }
    });
    res.status(200).json({ projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
};

/**
 * GET /api/projects/advised
 * Lists every project where the calling instructor is the assigned advisor.
 */
export const getAdvisedProjects = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const advisorId = req.user!.userId;
    const projects = await prisma.project.findMany({
      where: { advisorId },
      orderBy: { updatedAt: 'desc' },
      include: {
        category: true,
        owner: { select: { id: true, name: true, email: true } },
        teamMembers: {
          include: { user: { select: { id: true, name: true, email: true } } }
        },
        teamAd: true,
      }
    });
    res.status(200).json({ projects });
  } catch (error) {
    console.error('Error fetching advised projects:', error);
    res.status(500).json({ error: 'Failed to fetch advised projects' });
  }
};

export const getMyProjects = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { teamMembers: { some: { userId: userId } } }
        ]
      },
      include: {
        category: true,
        advisor: { select: { name: true } },
        teamMembers: {
          include: { user: { select: { name: true, email: true } } }
        },
        teamAd: true,
        advisorRequests: true,
        applications: true
      }
    });
    res.status(200).json({ projects });
  } catch (error) {
    console.error('Error fetching my projects:', error);
    res.status(500).json({ error: 'Failed to fetch my projects' });
  }
};

// -----------------------------------------------------------------------------
// Mutations on a single project (owner / member only)
// -----------------------------------------------------------------------------

export const updateProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { title, description, budget, requiredSkills, categoryId } = req.body;

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    if (project.ownerId !== userId) {
      res.status(403).json({ error: 'Only the project owner can edit this project' });
      return;
    }

    const updated = await prisma.project.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(budget !== undefined && { budget }),
        ...(requiredSkills !== undefined && { requiredSkills }),
        ...(categoryId !== undefined && { categoryId }),
      },
      include: {
        category: true,
        advisor: { select: { name: true } },
        teamMembers: {
          include: { user: { select: { name: true, email: true } } }
        },
      }
    });

    res.status(200).json({ message: 'Project updated successfully', project: updated });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
};

export const deleteProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    if (project.ownerId !== userId) {
      res.status(403).json({ error: 'Only the project owner can delete this project' });
      return;
    }

    // Cascade rules in schema.prisma already remove TeamMember / TeamAd /
    // ProjectApplication / AdvisorRequest rows tied to this project.
    await prisma.project.delete({ where: { id } });

    res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
};

export const leaveProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    if (project.ownerId === userId) {
      res.status(400).json({ error: 'Project owners cannot leave their own project. Delete it instead.' });
      return;
    }

    const membership = await prisma.teamMember.findUnique({
      where: { projectId_userId: { projectId: id, userId } }
    });
    if (!membership) {
      res.status(404).json({ error: 'You are not a member of this project' });
      return;
    }

    await prisma.teamMember.delete({ where: { id: membership.id } });
    res.status(200).json({ message: 'You have left the project' });
  } catch (error) {
    console.error('Error leaving project:', error);
    res.status(500).json({ error: 'Failed to leave project' });
  }
};

export const removeTeamMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const requesterId = req.user!.userId;
    const { id, userId: targetUserId } = req.params;

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    if (project.ownerId !== requesterId) {
      res.status(403).json({ error: 'Only the project owner can remove team members' });
      return;
    }
    if (project.ownerId === targetUserId) {
      res.status(400).json({ error: 'The project owner cannot be removed from the team' });
      return;
    }

    const membership = await prisma.teamMember.findUnique({
      where: { projectId_userId: { projectId: id, userId: targetUserId } }
    });
    if (!membership) {
      res.status(404).json({ error: 'User is not a member of this project' });
      return;
    }

    await prisma.teamMember.delete({ where: { id: membership.id } });
    res.status(200).json({ message: 'Team member removed successfully' });
  } catch (error) {
    console.error('Error removing team member:', error);
    res.status(500).json({ error: 'Failed to remove team member' });
  }
};

/**
 * POST /api/projects/:id/team-ad
 * Owner-only: publishes the project to the Team Ads feed by creating a TeamAd
 * row tied to it. Body fields are all optional — anything missing falls back
 * to sensible defaults pulled from the project itself.
 */
export const publishTeamAd = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { fullDescription, projectType, technicalSkills, interests } = req.body ?? {};

    const project = await prisma.project.findUnique({
      where: { id },
      include: { category: true, teamAd: true },
    });
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    if (project.ownerId !== userId) {
      res.status(403).json({ error: 'Only the project owner can publish a team ad' });
      return;
    }
    if (project.teamAd) {
      res.status(400).json({ error: 'This project is already published as a team ad' });
      return;
    }

    const teamAd = await prisma.teamAd.create({
      data: {
        projectId: project.id,
        authorId: userId,
        title: project.title,
        description: project.description,
        fullDescription: typeof fullDescription === 'string' ? fullDescription : null,
        projectType: typeof projectType === 'string' ? projectType : (project.category?.name ?? null),
        technicalSkills: Array.isArray(technicalSkills) ? technicalSkills : project.requiredSkills,
        interests: Array.isArray(interests) ? interests : [],
      },
    });

    res.status(201).json({ message: 'Project published to Team Ads', teamAd });
  } catch (error) {
    console.error('Error publishing team ad:', error);
    res.status(500).json({ error: 'Failed to publish team ad' });
  }
};

/**
 * DELETE /api/projects/:id/team-ad
 * Owner-only: removes the project's TeamAd row, taking it off the public feed.
 * Cascade on the schema cleans nothing else — TeamAd has no dependents.
 */
export const unpublishTeamAd = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: { teamAd: true },
    });
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    if (project.ownerId !== userId) {
      res.status(403).json({ error: 'Only the project owner can unpublish a team ad' });
      return;
    }
    if (!project.teamAd) {
      res.status(404).json({ error: 'This project has no team ad to remove' });
      return;
    }

    await prisma.teamAd.delete({ where: { id: project.teamAd.id } });
    res.status(200).json({ message: 'Team ad removed' });
  } catch (error) {
    console.error('Error unpublishing team ad:', error);
    res.status(500).json({ error: 'Failed to unpublish team ad' });
  }
};

export const updateTeamMemberRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const requesterId = req.user!.userId;
    const { id, userId: targetUserId } = req.params;
    const { role } = req.body;

    if (typeof role !== 'string' || role.trim().length === 0) {
      res.status(400).json({ error: 'Role is required' });
      return;
    }

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    if (project.ownerId !== requesterId) {
      res.status(403).json({ error: 'Only the project owner can change member roles' });
      return;
    }

    const membership = await prisma.teamMember.findUnique({
      where: { projectId_userId: { projectId: id, userId: targetUserId } }
    });
    if (!membership) {
      res.status(404).json({ error: 'User is not a member of this project' });
      return;
    }

    const updated = await prisma.teamMember.update({
      where: { id: membership.id },
      data: { role: role.trim() },
      include: { user: { select: { name: true, email: true } } }
    });

    res.status(200).json({ message: 'Member role updated', member: updated });
  } catch (error) {
    console.error('Error updating member role:', error);
    res.status(500).json({ error: 'Failed to update member role' });
  }
};
