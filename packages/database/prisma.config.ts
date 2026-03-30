import { defineConfig } from 'prisma/config';
import { z } from 'zod';

const validated = z
	.object({
		DATABASE_URL: z.string().trim().min(1),
	})
	.parse(process.env);

export default defineConfig({
	schema: 'prisma/schema.prisma',
	migrations: {
		path: 'prisma/migrations',
	},
	datasource: {
		url: validated.DATABASE_URL,
	},
});
