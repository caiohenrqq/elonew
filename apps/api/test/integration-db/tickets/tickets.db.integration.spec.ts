import { PrismaService } from '@app/common/prisma/prisma.service';
import type { AuthenticatedUser } from '@modules/auth/application/authenticated-user';
import { TicketStatus } from '@modules/tickets/domain/ticket.entity';
import { AdminTicketsController } from '@modules/tickets/presentation/admin-tickets.controller';
import { TicketsController } from '@modules/tickets/presentation/tickets.controller';
import { TicketsModule } from '@modules/tickets/tickets.module';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { Role } from '@packages/auth/roles/role';

describe('Tickets module integration (db)', () => {
	let moduleRef: TestingModule;
	let controller: TicketsController;
	let adminController: AdminTicketsController;
	let prisma: PrismaService;
	let clientUser: AuthenticatedUser;
	let adminUser: AuthenticatedUser;

	beforeEach(async () => {
		moduleRef = await Test.createTestingModule({
			imports: [TicketsModule],
		}).compile();

		controller = moduleRef.get(TicketsController);
		adminController = moduleRef.get(AdminTicketsController);
		prisma = moduleRef.get(PrismaService);
		await prisma.ticketMessage.deleteMany();
		await prisma.ticket.deleteMany();
		await prisma.order.deleteMany();
		await prisma.user.deleteMany();

		const user = await prisma.user.create({
			data: {
				username: 'ticket-client',
				email: 'ticket-client@example.com',
				password: 'secret',
				role: 'CLIENT',
			},
		});
		clientUser = {
			id: user.id,
			role: Role.CLIENT,
		};
		const admin = await prisma.user.create({
			data: {
				username: 'ticket-admin',
				email: 'ticket-admin@example.com',
				password: 'secret',
				role: 'ADMIN',
			},
		});
		adminUser = {
			id: admin.id,
			role: Role.ADMIN,
		};
	});

	afterEach(async () => {
		await moduleRef.close();
	});

	it('persists an order-linked ticket with chronological message history', async () => {
		const order = await prisma.order.create({
			data: {
				clientId: clientUser.id,
				status: 'pending_booster',
			},
		});

		const created = await controller.create(
			{
				subject: 'Order support',
				content: 'Initial message',
				orderId: order.id,
			},
			clientUser,
		);
		const replied = await controller.reply(
			created.id,
			{ content: 'Second message' },
			clientUser,
		);

		expect(replied).toMatchObject({
			id: created.id,
			orderId: order.id,
			status: TicketStatus.WAITING_SUPPORT,
			messages: [
				expect.objectContaining({ content: 'Initial message' }),
				expect.objectContaining({ content: 'Second message' }),
			],
		});

		const persisted = await prisma.ticket.findUnique({
			where: { id: created.id },
			include: {
				messages: {
					orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
				},
			},
		});

		expect(persisted).toMatchObject({
			orderId: order.id,
			status: TicketStatus.WAITING_SUPPORT,
		});
		expect(persisted?.messages.map((message) => message.content)).toEqual([
			'Initial message',
			'Second message',
		]);
	});

	it('persists admin replies and reopens closed tickets', async () => {
		const created = await controller.create(
			{
				subject: 'Payment support',
				content: 'Initial message',
			},
			clientUser,
		);
		await adminController.updateStatus(
			created.id,
			{ status: TicketStatus.CLOSED },
			adminUser,
		);

		const replied = await adminController.reply(
			created.id,
			{ content: 'Reopening with a support response.' },
			adminUser,
		);

		expect(replied).toMatchObject({
			status: TicketStatus.WAITING_USER,
			messages: [
				expect.objectContaining({ senderRole: Role.CLIENT }),
				expect.objectContaining({ senderRole: Role.ADMIN }),
			],
		});

		const persisted = await prisma.ticket.findUnique({
			where: { id: created.id },
			include: {
				messages: {
					include: { sender: true },
					orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
				},
			},
		});

		expect(persisted?.status).toBe(TicketStatus.WAITING_USER);
		expect(persisted?.messages.map((message) => message.sender.role)).toEqual([
			'CLIENT',
			'ADMIN',
		]);
	});
});
