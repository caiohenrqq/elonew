import { validateDatabaseEnv } from '@packages/config/env/database-env.config';
import { defineConfig } from 'prisma/config';

const validated = validateDatabaseEnv(process.env);

export default defineConfig({
	schema: 'prisma/schema.prisma',
	migrations: {
		path: 'prisma/migrations',
	},
	datasource: {
		url: validated.DATABASE_URL,
	},
});
