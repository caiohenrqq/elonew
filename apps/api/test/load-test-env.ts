import { resolve } from 'node:path';

process.loadEnvFile(resolve(process.cwd(), '.env.test'));
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ??=
	'postgresql://postgres:postgres@localhost:5432/elonew_test';
process.env.MERCADO_PAGO_WEBHOOK_SECRET ??= 'test-mercado-pago-webhook-secret';
