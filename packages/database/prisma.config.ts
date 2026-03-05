import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'prisma/config';

const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
loadEnv({ path: resolve(process.cwd(), '../../apps/api', envFile) });

if (!process.env.DATABASE_URL) {
	throw new Error(`DATABASE_URL is required in apps/api/${envFile}.`);
}

export default defineConfig({
	schema: 'prisma/schema.prisma',
	migrations: {
		path: 'prisma/migrations',
	},
	datasource: {
		url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
	},
});
