import { defineConfig } from 'prisma/config';
import { envSchema } from '../config/src/env/env.schema';

const validated = envSchema.pick({ DATABASE_URL: true }).parse(process.env);

export default defineConfig({
	schema: 'prisma/schema.prisma',
	migrations: {
		path: 'prisma/migrations',
	},
	datasource: {
		url: validated.DATABASE_URL,
	},
});
