import { resolve } from 'node:path';

process.loadEnvFile(resolve(process.cwd(), '.env.test'));
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ??=
	'postgresql://postgres:postgres@localhost:5432/elonew_test';
process.env.MERCADO_PAGO_ACCESS_TOKEN ??= 'test-mercado-pago-access-token';
process.env.MERCADO_PAGO_WEBHOOK_SECRET ??= 'test-mercado-pago-webhook-secret';
process.env.MERCADO_PAGO_WEBHOOK_URL ??=
	'https://example.com/payments/webhooks/mercadopago';
process.env.JWT_REFRESH_TOKEN_SECRET ??= 'test-refresh-secret';
process.env.EMAIL_CONFIRMATION_TOKEN_SECRET ??=
	'test-email-confirmation-secret';
process.env.ORDER_CREDENTIALS_ENCRYPTION_KEY ??=
	'MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=';
