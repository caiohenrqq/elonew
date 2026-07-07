import type {
	EmailSenderPort,
	SendEmailInput,
} from '@app/common/email/ports/email-sender.port';
import type { AppSettingsService } from '@app/common/settings/app-settings.service';
import type { OrderClientReaderPort } from '@modules/orders/application/ports/order-client-reader.port';
import { OrderLifecycleEmailService } from '@modules/orders/application/services/order-lifecycle-email.service';
import { Order } from '@modules/orders/domain/order.entity';

class EmailSenderSpy implements EmailSenderPort {
	readonly sent: SendEmailInput[] = [];

	async send(input: SendEmailInput): Promise<void> {
		this.sent.push(input);
	}
}

const clientReaderStub = (email: string | null): OrderClientReaderPort => ({
	findEmailById: async () => email,
	hasPaidOrder: async () => false,
});

const appSettingsStub = {
	webAppUrl: 'https://elonew.test',
} as AppSettingsService;

const makeOrder = () =>
	Order.create('order-1', {
		clientId: 'client-1',
		requestDetails: {
			serviceType: 'elo_boost',
			currentLeague: 'iron',
			currentDivision: 'IV',
			currentLp: 0,
			desiredLeague: 'gold',
			desiredDivision: 'IV',
			server: 'br',
			desiredQueue: 'solo_duo',
			lpGain: 20,
			deadline: new Date('2026-08-01T00:00:00Z'),
		},
	});

describe('OrderLifecycleEmailService', () => {
	it('sends the order paid email to the client', async () => {
		const emailSender = new EmailSenderSpy();
		const service = new OrderLifecycleEmailService(
			clientReaderStub('client@elonew.test'),
			emailSender,
			appSettingsStub,
		);

		await service.sendOrderPaidEmail(makeOrder());

		expect(emailSender.sent).toHaveLength(1);
		expect(emailSender.sent[0].to).toBe('client@elonew.test');
		expect(emailSender.sent[0].subject).toContain('Pagamento confirmado');
		expect(emailSender.sent[0].html).toContain('Iron IV → Gold IV');
		expect(emailSender.sent[0].html).toContain(
			'https://elonew.test/client/orders/order-1',
		);
	});

	it('sends the booster assigned email to the client', async () => {
		const emailSender = new EmailSenderSpy();
		const service = new OrderLifecycleEmailService(
			clientReaderStub('client@elonew.test'),
			emailSender,
			appSettingsStub,
		);

		await service.sendBoosterAssignedEmail(makeOrder());

		expect(emailSender.sent).toHaveLength(1);
		expect(emailSender.sent[0].subject).toContain('booster assumiu');
	});

	it('skips sending when the client has no email', async () => {
		const emailSender = new EmailSenderSpy();
		const service = new OrderLifecycleEmailService(
			clientReaderStub(null),
			emailSender,
			appSettingsStub,
		);

		await service.sendOrderPaidEmail(makeOrder());

		expect(emailSender.sent).toHaveLength(0);
	});

	it('swallows sender failures without throwing', async () => {
		const failingSender: EmailSenderPort = {
			send: async () => {
				throw new Error('provider down');
			},
		};
		const service = new OrderLifecycleEmailService(
			clientReaderStub('client@elonew.test'),
			failingSender,
			appSettingsStub,
		);

		await expect(
			service.sendOrderPaidEmail(makeOrder()),
		).resolves.toBeUndefined();
	});
});
