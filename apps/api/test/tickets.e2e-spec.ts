import { TICKET_REPOSITORY_KEY } from '@modules/tickets/application/ports/ticket-repository.port';
import { TicketStatus } from '@modules/tickets/domain/ticket.entity';
import { USER_REPOSITORY_KEY } from '@modules/users/application/ports/user-repository.port';
import { Test } from '@nestjs/testing';
import { Role } from '@packages/auth/roles/role';
import { AppModule } from '../src/app.module';
import type { ApiHttpApp } from '../src/common/http/http-app.factory';
import { createTestHttpApp, requestHttp } from './create-test-http-app';
import { signTestAccessToken as signToken } from './support/auth-token';
import { E2eUserRepositoryStub } from './support/e2e-user-repository.stub';
import { InMemoryTicketRepository } from './support/in-memory/tickets/in-memory-ticket.repository';

describe('Tickets (e2e)', () => {
	let app: ApiHttpApp;
	let tickets: InMemoryTicketRepository;

	const clientToken = () => signToken({ sub: 'client-1', role: Role.CLIENT });
	const otherClientToken = () =>
		signToken({ sub: 'client-2', role: Role.CLIENT });
	const boosterToken = () =>
		signToken({ sub: 'booster-1', role: Role.BOOSTER });
	const adminToken = () => signToken({ sub: 'admin-1', role: Role.ADMIN });

	beforeEach(async () => {
		tickets = new InMemoryTicketRepository();
		const moduleRef = await Test.createTestingModule({
			imports: [AppModule],
		})
			.overrideProvider(USER_REPOSITORY_KEY)
			.useClass(E2eUserRepositoryStub)
			.overrideProvider(TICKET_REPOSITORY_KEY)
			.useValue(tickets)
			.compile();

		app = await createTestHttpApp(moduleRef);
	});

	afterEach(async () => {
		await app.close();
	});

	it('creates a client order-linked ticket and lists it for the owner', async () => {
		tickets.setClientOrderOwner('order-1', 'client-1');

		await requestHttp(app)
			.post('/tickets')
			.set('Authorization', `Bearer ${clientToken()}`)
			.send({
				subject: 'Order question',
				content: 'Can you check my order?',
				orderId: 'order-1',
			})
			.expect(201)
			.expect<{
				orderId: string;
				status: string;
				messages: Array<{ content: string }>;
			}>(({ body }) => {
				expect(body.orderId).toBe('order-1');
				expect(body.status).toBe(TicketStatus.WAITING_SUPPORT);
				expect(body.messages).toEqual([
					expect.objectContaining({ content: 'Can you check my order?' }),
				]);
			})
			.execute();

		await requestHttp(app)
			.get('/tickets')
			.set('Authorization', `Bearer ${clientToken()}`)
			.expect(200)
			.expect<Array<{ subject: string }>>(({ body }) => {
				expect(body).toEqual([
					expect.objectContaining({ subject: 'Order question' }),
				]);
			})
			.execute();
	});

	it('rejects booster order-linked ticket creation', async () => {
		await requestHttp(app)
			.post('/tickets')
			.set('Authorization', `Bearer ${boosterToken()}`)
			.send({
				subject: 'Order question',
				content: 'Can you check this order?',
				orderId: 'order-1',
			})
			.expect(400)
			.execute();
	});

	it('allows boosters to create general support tickets', async () => {
		await requestHttp(app)
			.post('/tickets')
			.set('Authorization', `Bearer ${boosterToken()}`)
			.send({
				subject: 'Booster account question',
				content: 'Can support check my account?',
			})
			.expect(201)
			.expect<{
				orderId: string | null;
				status: string;
				messages: Array<{ senderRole: string }>;
			}>(({ body }) => {
				expect(body.orderId).toBeNull();
				expect(body.status).toBe(TicketStatus.WAITING_SUPPORT);
				expect(body.messages[0]?.senderRole).toBe(Role.BOOSTER);
			})
			.execute();
	});

	it('hides cross-user tickets as not found', async () => {
		await requestHttp(app)
			.post('/tickets')
			.set('Authorization', `Bearer ${clientToken()}`)
			.send({
				subject: 'Private question',
				content: 'Private content',
			})
			.expect(201)
			.execute();

		await requestHttp(app)
			.get('/tickets/ticket-1')
			.set('Authorization', `Bearer ${otherClientToken()}`)
			.expect(404)
			.execute();
	});

	it('updates status when users and admins reply', async () => {
		await requestHttp(app)
			.post('/tickets')
			.set('Authorization', `Bearer ${clientToken()}`)
			.send({
				subject: 'Payment question',
				content: 'Initial message',
			})
			.expect(201)
			.execute();

		await requestHttp(app)
			.post('/admin/tickets/ticket-1/messages')
			.set('Authorization', `Bearer ${adminToken()}`)
			.send({ content: 'Need more details.' })
			.expect(201)
			.expect<{ status: string; messages: unknown[] }>(({ body }) => {
				expect(body.status).toBe(TicketStatus.WAITING_USER);
				expect(body.messages).toHaveLength(2);
			})
			.execute();

		await requestHttp(app)
			.post('/tickets/ticket-1/messages')
			.set('Authorization', `Bearer ${clientToken()}`)
			.send({ content: 'Here are the details.' })
			.expect(201)
			.expect<{ status: string; messages: unknown[] }>(({ body }) => {
				expect(body.status).toBe(TicketStatus.WAITING_SUPPORT);
				expect(body.messages).toHaveLength(3);
			})
			.execute();
	});

	it('allows admins to list and update tickets', async () => {
		await requestHttp(app)
			.post('/tickets')
			.set('Authorization', `Bearer ${clientToken()}`)
			.send({
				subject: 'Payment question',
				content: 'Initial message',
			})
			.expect(201)
			.execute();

		await requestHttp(app)
			.get('/admin/tickets')
			.set('Authorization', `Bearer ${adminToken()}`)
			.expect(200)
			.expect<Array<{ id: string }>>(({ body }) => {
				expect(body).toEqual([expect.objectContaining({ id: 'ticket-1' })]);
			})
			.execute();

		await requestHttp(app)
			.patch('/admin/tickets/ticket-1/status')
			.set('Authorization', `Bearer ${adminToken()}`)
			.send({ status: TicketStatus.CLOSED })
			.expect(200)
			.expect<{ status: string }>(({ body }) => {
				expect(body.status).toBe(TicketStatus.CLOSED);
			})
			.execute();
	});

	it('rejects non-admin access to admin ticket routes', async () => {
		await requestHttp(app)
			.get('/admin/tickets')
			.set('Authorization', `Bearer ${clientToken()}`)
			.expect(403)
			.execute();
	});

	it('rejects invalid request payloads', async () => {
		await requestHttp(app)
			.post('/tickets')
			.set('Authorization', `Bearer ${clientToken()}`)
			.send({ subject: '  ', content: '' })
			.expect(400)
			.execute();
	});
});
