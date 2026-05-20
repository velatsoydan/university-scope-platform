import { z } from 'zod';

export const applyToProjectSchema = z.object({
  body: z.object({
    projectId: z.uuid({ error: 'Invalid Project ID format. Must be a valid UUID' }),
    requestedRoles: z.array(z.string().min(1)).min(1, 'At least one role is required'),
  }),
});

export const updateApplicationStatusSchema = z.object({
  params: z.object({
    applicationId: z.uuid({ error: 'Invalid Application ID format. Must be a valid UUID' }),
  }),
  body: z.object({
    status: z.enum(['ACCEPTED', 'REJECTED'], {
      message: 'Status must be either ACCEPTED or REJECTED',
    }),
  }),
});
