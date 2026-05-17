export {
	type AdminReasonInput as AdminReasonSchemaInput,
	adminReasonSchema,
} from '@packages/shared/admin/admin-governance.schema';

import { z } from 'zod';

export const adminIdParamSchema = z.string().trim().min(1);

export type AdminIdParamSchemaInput = z.infer<typeof adminIdParamSchema>;

export const adminListQuerySchema = z.object({
	limit: z.coerce.number().int().min(1).max(100).default(25),
	query: z.string().trim().min(1).max(120).optional(),
});

export type AdminListQuerySchemaInput = z.infer<typeof adminListQuerySchema>;
