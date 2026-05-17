import { z } from 'zod';

export const adminReasonSchema = z.object({
	reason: z.string().trim().min(1).max(500),
});

export const adminGovernanceInputSchema = z.object({
	targetId: z.string().trim().min(1),
	reason: adminReasonSchema.shape.reason,
});

export type AdminReasonInput = z.infer<typeof adminReasonSchema>;
export type AdminGovernanceInput = z.infer<typeof adminGovernanceInputSchema>;
