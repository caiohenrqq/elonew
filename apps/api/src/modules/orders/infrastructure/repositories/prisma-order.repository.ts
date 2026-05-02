import { PrismaService } from '@app/common/prisma/prisma.service';
import type {
	BoosterOrderDashboardSnapshot,
	BoosterOrderReaderPort,
} from '@modules/orders/application/ports/booster-order-reader.port';
import type {
	ClientOrderDashboardSnapshot,
	ClientOrderReaderPort,
} from '@modules/orders/application/ports/client-order-reader.port';
import type { OrderRepositoryPort } from '@modules/orders/application/ports/order-repository.port';
import {
	Order,
	type OrderCredentials,
	type OrderRequestDetails,
} from '@modules/orders/domain/order.entity';
import { OrderStatus } from '@modules/orders/domain/order-status';
import { OrderCredentialsCipherService } from '@modules/orders/infrastructure/security/order-credentials-cipher.service';
import { Injectable } from '@nestjs/common';
import {
	isOrderExtraType,
	type OrderPricedExtra,
} from '@packages/shared/orders/order-extra';
import type { OrderServiceType } from '@packages/shared/orders/service-type';
import { ensurePersistedEnum } from '@packages/shared/utils/enum.utils';

type OrderRecord = {
	id: string;
	clientId: string | null;
	boosterId: string | null;
	couponId: string | null;
	pricingVersionId: string | null;
	status: string;
	serviceType: string | null;
	currentLeague: string | null;
	currentDivision: string | null;
	currentLp: number | null;
	desiredLeague: string | null;
	desiredDivision: string | null;
	server: string | null;
	desiredQueue: string | null;
	lpGain: number | null;
	deadline: Date | null;
	subtotal: number | null;
	totalAmount: number | null;
	discountAmount: number;
	extras: Array<{
		type: string;
		price: number;
	}>;
	credentials: {
		login: string;
		summonerName: string;
		password: string;
	} | null;
};

type OrderDelegate = {
	findUnique(args: {
		where: { id: string };
		include: { credentials: true; extras: true };
	}): Promise<OrderRecord | null>;
	findFirst(args: {
		where: { id: string; clientId: string };
		include: { credentials: true; extras: true };
	}): Promise<OrderRecord | null>;
	findFirst(args: {
		where: { clientId: string };
		select: { id: true };
	}): Promise<{ id: string } | null>;
	findMany(args: {
		where:
			| { clientId: string }
			| {
					status: string;
					OR?: Array<{ boosterId: string | null }>;
					boosterId?: string;
					boosterRejections?: { none: { boosterId: string } };
			  };
		include: { extras: true };
		orderBy: { createdAt: 'desc' };
		take: number;
	}): Promise<Array<Omit<OrderRecord, 'credentials'> & { createdAt: Date }>>;
	count(args: {
		where: { clientId: string; status?: { in: string[] } };
	}): Promise<number>;
	aggregate(args: {
		where: { clientId: string };
		_sum: { totalAmount: true };
	}): Promise<{ _sum: { totalAmount: number | null } }>;
	create(args: {
		data: {
			id?: string;
			clientId: string | null;
			boosterId: string | null;
			couponId: string | null;
			pricingVersionId: string | null;
			status: string;
			serviceType: string | null;
			currentLeague: string | null;
			currentDivision: string | null;
			currentLp: number | null;
			desiredLeague: string | null;
			desiredDivision: string | null;
			server: string | null;
			desiredQueue: string | null;
			lpGain: number | null;
			deadline: Date | null;
			subtotal: number | null;
			totalAmount: number | null;
			discountAmount: number;
			extras?: {
				create: Array<{
					type: string;
					price: number;
				}>;
			};
			credentials?:
				| {
						create: {
							login: string;
							summonerName: string;
							password: string;
						};
				  }
				| undefined;
		};
		include: { credentials: true; extras: true };
	}): Promise<OrderRecord>;
	upsert(args: {
		where: { id: string };
		create: {
			id: string;
			clientId: string | null;
			boosterId: string | null;
			couponId: string | null;
			pricingVersionId: string | null;
			status: string;
			serviceType: string | null;
			currentLeague: string | null;
			currentDivision: string | null;
			currentLp: number | null;
			desiredLeague: string | null;
			desiredDivision: string | null;
			server: string | null;
			desiredQueue: string | null;
			lpGain: number | null;
			deadline: Date | null;
			subtotal: number | null;
			totalAmount: number | null;
			discountAmount: number;
			extras?: {
				create: Array<{
					type: string;
					price: number;
				}>;
			};
			credentials?:
				| {
						create: {
							login: string;
							summonerName: string;
							password: string;
						};
				  }
				| undefined;
		};
		update: {
			clientId: string | null;
			boosterId: string | null;
			couponId: string | null;
			pricingVersionId: string | null;
			status: string;
			serviceType: string | null;
			currentLeague: string | null;
			currentDivision: string | null;
			currentLp: number | null;
			desiredLeague: string | null;
			desiredDivision: string | null;
			server: string | null;
			desiredQueue: string | null;
			lpGain: number | null;
			deadline: Date | null;
			subtotal: number | null;
			totalAmount: number | null;
			discountAmount: number;
			extras?: {
				deleteMany: Record<string, never>;
				create: Array<{
					type: string;
					price: number;
				}>;
			};
			credentials?:
				| {
						upsert: {
							create: {
								login: string;
								summonerName: string;
								password: string;
							};
							update: {
								login: string;
								summonerName: string;
								password: string;
							};
						};
				  }
				| undefined;
		};
	}): Promise<OrderRecord>;
};

type OrderCredentialsDelegate = {
	deleteMany(args: { where: { orderId: string } }): Promise<{ count: number }>;
};

type OrderBoosterRejectionDelegate = {
	upsert(args: {
		where: { orderId_boosterId: { orderId: string; boosterId: string } };
		create: { orderId: string; boosterId: string };
		update: Record<string, never>;
	}): Promise<unknown>;
};

type OrderPrismaClient = {
	order: OrderDelegate;
	orderCredentials: OrderCredentialsDelegate;
};

type OrderRejectionPrismaClient = OrderPrismaClient & {
	orderBoosterRejection: OrderBoosterRejectionDelegate;
};

@Injectable()
export class PrismaOrderRepository
	implements OrderRepositoryPort, ClientOrderReaderPort, BoosterOrderReaderPort
{
	constructor(
		private readonly prisma: PrismaService,
		private readonly orderCredentialsCipher: OrderCredentialsCipherService,
	) {}

	async create(order: Order): Promise<Order> {
		const record = await this.getDelegate().create({
			data: {
				id: order.id || undefined,
				clientId: order.clientId,
				boosterId: order.boosterId,
				couponId: order.couponId,
				pricingVersionId: order.pricingVersionId,
				status: order.status,
				...this.mapRequestDetails(order.requestDetails),
				...this.mapPricing(order),
				extras: this.mapExtrasCreate(order.extras),
				credentials: this.mapCredentialsCreate(order.credentials),
			},
			include: { credentials: true, extras: true },
		});

		return this.mapOrderFromRecord(record);
	}

	async findById(id: string): Promise<Order | null> {
		const record = await this.getDelegate().findUnique({
			where: { id },
			include: { credentials: true, extras: true },
		});
		if (!record) return null;

		return this.mapOrderFromRecord(record);
	}

	async findByIdForClient(id: string, clientId: string): Promise<Order | null> {
		const record = await this.getDelegate().findFirst({
			where: { id, clientId },
			include: { credentials: true, extras: true },
		});
		if (!record) return null;

		return this.mapOrderFromRecord(record);
	}

	async existsForClient(clientId: string): Promise<boolean> {
		const record = await this.getDelegate().findFirst({
			where: { clientId },
			select: { id: true },
		});

		return record !== null;
	}

	async findRecentForClient(
		clientId: string,
		limit: number,
	): Promise<ClientOrderDashboardSnapshot[]> {
		const records = await this.getDelegate().findMany({
			where: { clientId },
			include: { extras: true },
			orderBy: { createdAt: 'desc' },
			take: limit,
		});

		return records.map((record) => this.mapDashboardSnapshotFromRecord(record));
	}

	async countActiveForClient(clientId: string): Promise<number> {
		return await this.getDelegate().count({
			where: {
				clientId,
				status: {
					in: [
						OrderStatus.AWAITING_PAYMENT,
						OrderStatus.PENDING_BOOSTER,
						OrderStatus.IN_PROGRESS,
					],
				},
			},
		});
	}

	async countForClient(clientId: string): Promise<number> {
		return await this.getDelegate().count({
			where: { clientId },
		});
	}

	async sumTotalAmountForClient(clientId: string): Promise<number> {
		const result = await this.getDelegate().aggregate({
			where: { clientId },
			_sum: { totalAmount: true },
		});

		return result._sum.totalAmount ?? 0;
	}

	async findAvailableForBooster(
		boosterId: string,
		limit: number,
	): Promise<BoosterOrderDashboardSnapshot[]> {
		const records = await this.getDelegate().findMany({
			where: {
				status: OrderStatus.PENDING_BOOSTER,
				OR: [{ boosterId: null }, { boosterId }],
				boosterRejections: { none: { boosterId } },
			},
			include: { extras: true },
			orderBy: { createdAt: 'desc' },
			take: limit,
		});

		return records.map((record) =>
			this.mapBoosterDashboardSnapshotFromRecord(record),
		);
	}

	async findActiveForBooster(
		boosterId: string,
		limit: number,
	): Promise<BoosterOrderDashboardSnapshot[]> {
		const records = await this.getDelegate().findMany({
			where: {
				status: OrderStatus.IN_PROGRESS,
				boosterId,
			},
			include: { extras: true },
			orderBy: { createdAt: 'desc' },
			take: limit,
		});

		return records.map((record) =>
			this.mapBoosterDashboardSnapshotFromRecord(record),
		);
	}

	async findRecentCompletedForBooster(
		boosterId: string,
		limit: number,
	): Promise<BoosterOrderDashboardSnapshot[]> {
		const records = await this.getDelegate().findMany({
			where: {
				status: OrderStatus.COMPLETED,
				boosterId,
			},
			include: { extras: true },
			orderBy: { createdAt: 'desc' },
			take: limit,
		});

		return records.map((record) =>
			this.mapBoosterDashboardSnapshotFromRecord(record),
		);
	}

	async save(order: Order): Promise<void> {
		await this.saveWithClient(order, this.getClient());
	}

	async saveBoosterRejection(order: Order, boosterId: string): Promise<void> {
		await this.prisma.$transaction(async (tx) => {
			const client = tx as unknown as OrderRejectionPrismaClient;
			await client.orderBoosterRejection.upsert({
				where: {
					orderId_boosterId: {
						orderId: order.id,
						boosterId,
					},
				},
				create: {
					orderId: order.id,
					boosterId,
				},
				update: {},
			});
			await this.saveWithClient(order, client);
		});
	}

	private async saveWithClient(
		order: Order,
		client: OrderPrismaClient,
	): Promise<void> {
		const credentialsCreate = this.mapCredentialsCreate(order.credentials);
		const credentialsUpdate = this.mapCredentialsUpdate(order.credentials);
		if (!order.credentials) {
			await client.orderCredentials.deleteMany({
				where: { orderId: order.id },
			});
		}

		await client.order.upsert({
			where: { id: order.id },
			create: {
				id: order.id,
				clientId: order.clientId,
				boosterId: order.boosterId,
				couponId: order.couponId,
				pricingVersionId: order.pricingVersionId,
				status: order.status,
				...this.mapRequestDetails(order.requestDetails),
				...this.mapPricing(order),
				extras: this.mapExtrasCreate(order.extras),
				credentials: credentialsCreate,
			},
			update: {
				clientId: order.clientId,
				boosterId: order.boosterId,
				couponId: order.couponId,
				pricingVersionId: order.pricingVersionId,
				status: order.status,
				...this.mapRequestDetails(order.requestDetails),
				...this.mapPricing(order),
				extras: this.mapExtrasUpdate(order.extras),
				credentials: credentialsUpdate,
			},
		});
	}

	private getClient(): OrderPrismaClient {
		return this.prisma as unknown as OrderPrismaClient;
	}

	private getDelegate(): OrderDelegate {
		return this.getClient().order;
	}

	private mapOrderFromRecord(record: OrderRecord): Order {
		return Order.rehydrate({
			id: record.id,
			clientId: record.clientId,
			boosterId: record.boosterId,
			couponId: record.couponId,
			pricingVersionId: record.pricingVersionId,
			status: ensurePersistedEnum(OrderStatus, record.status, 'order status'),
			credentials: this.mapCredentialsFromRecord(record.credentials),
			requestDetails: this.mapRequestDetailsFromRecord(record),
			subtotal: record.subtotal,
			totalAmount: record.totalAmount,
			discountAmount: record.discountAmount,
			extras: (record.extras ?? []).map((extra) =>
				this.mapExtraFromRecord(extra),
			),
		});
	}

	private mapDashboardSnapshotFromRecord(
		record: Omit<OrderRecord, 'credentials'> & { createdAt: Date },
	): ClientOrderDashboardSnapshot {
		return {
			id: record.id,
			clientId: record.clientId,
			status: ensurePersistedEnum(OrderStatus, record.status, 'order status'),
			serviceType: record.serviceType
				? this.mapServiceTypeFromPersistence(record.serviceType)
				: null,
			currentLeague: record.currentLeague,
			currentDivision: record.currentDivision,
			currentLp: record.currentLp,
			desiredLeague: record.desiredLeague,
			desiredDivision: record.desiredDivision,
			server: record.server,
			desiredQueue: record.desiredQueue,
			lpGain: record.lpGain,
			deadline: record.deadline,
			subtotal: record.subtotal,
			totalAmount: record.totalAmount,
			discountAmount: record.discountAmount,
			createdAt: record.createdAt,
		};
	}

	private mapBoosterDashboardSnapshotFromRecord(
		record: Omit<OrderRecord, 'credentials'> & { createdAt: Date },
	): BoosterOrderDashboardSnapshot {
		const totalAmount = record.totalAmount;

		return {
			id: record.id,
			boosterId: record.boosterId,
			status: ensurePersistedEnum(OrderStatus, record.status, 'order status'),
			serviceType: record.serviceType
				? this.mapServiceTypeFromPersistence(record.serviceType)
				: null,
			currentLeague: record.currentLeague,
			currentDivision: record.currentDivision,
			currentLp: record.currentLp,
			desiredLeague: record.desiredLeague,
			desiredDivision: record.desiredDivision,
			server: record.server,
			desiredQueue: record.desiredQueue,
			lpGain: record.lpGain,
			deadline: record.deadline,
			totalAmount,
			boosterAmount:
				totalAmount === null ? 0 : Number((totalAmount * 0.7).toFixed(2)),
			createdAt: record.createdAt,
		};
	}

	private mapExtrasCreate(extras?: OrderPricedExtra[]):
		| {
				create: Array<{
					type: string;
					price: number;
				}>;
		  }
		| undefined {
		if (!extras || extras.length === 0) return undefined;

		return {
			create: extras.map((extra) => ({
				type: extra.type,
				price: extra.price,
			})),
		};
	}

	private mapExtrasUpdate(extras?: OrderPricedExtra[]): {
		deleteMany: Record<string, never>;
		create: Array<{
			type: string;
			price: number;
		}>;
	} {
		return {
			deleteMany: {},
			create: (extras ?? []).map((extra) => ({
				type: extra.type,
				price: extra.price,
			})),
		};
	}

	private mapExtraFromRecord(record: {
		type: string;
		price: number;
	}): OrderPricedExtra {
		if (!isOrderExtraType(record.type))
			throw new Error(`Invalid order extra type persisted: ${record.type}`);

		return {
			type: record.type,
			price: record.price,
		};
	}

	private mapCredentialsFromRecord(
		record: OrderRecord['credentials'],
	): OrderCredentials | null {
		if (!record) return null;

		return {
			login: this.orderCredentialsCipher.decrypt(record.login),
			summonerName: this.orderCredentialsCipher.decrypt(record.summonerName),
			password: this.orderCredentialsCipher.decrypt(record.password),
		};
	}

	private mapCredentialsCreate(credentials: OrderCredentials | null):
		| {
				create: {
					login: string;
					summonerName: string;
					password: string;
				};
		  }
		| undefined {
		if (!credentials) return undefined;

		return {
			create: {
				login: this.orderCredentialsCipher.encrypt(credentials.login),
				summonerName: this.orderCredentialsCipher.encrypt(
					credentials.summonerName,
				),
				password: this.orderCredentialsCipher.encrypt(credentials.password),
			},
		};
	}

	private mapCredentialsUpdate(credentials: OrderCredentials | null):
		| {
				upsert: {
					create: {
						login: string;
						summonerName: string;
						password: string;
					};
					update: {
						login: string;
						summonerName: string;
						password: string;
					};
				};
		  }
		| undefined {
		if (!credentials) return undefined;

		return {
			upsert: {
				create: {
					login: this.orderCredentialsCipher.encrypt(credentials.login),
					summonerName: this.orderCredentialsCipher.encrypt(
						credentials.summonerName,
					),
					password: this.orderCredentialsCipher.encrypt(credentials.password),
				},
				update: {
					login: this.orderCredentialsCipher.encrypt(credentials.login),
					summonerName: this.orderCredentialsCipher.encrypt(
						credentials.summonerName,
					),
					password: this.orderCredentialsCipher.encrypt(credentials.password),
				},
			},
		};
	}

	private mapRequestDetails(requestDetails: OrderRequestDetails | null): {
		serviceType: string | null;
		currentLeague: string | null;
		currentDivision: string | null;
		currentLp: number | null;
		desiredLeague: string | null;
		desiredDivision: string | null;
		server: string | null;
		desiredQueue: string | null;
		lpGain: number | null;
		deadline: Date | null;
	} {
		return {
			serviceType: requestDetails
				? this.mapServiceTypeToPersistence(requestDetails.serviceType)
				: null,
			currentLeague: requestDetails?.currentLeague ?? null,
			currentDivision: requestDetails?.currentDivision ?? null,
			currentLp: requestDetails?.currentLp ?? null,
			desiredLeague: requestDetails?.desiredLeague ?? null,
			desiredDivision: requestDetails?.desiredDivision ?? null,
			server: requestDetails?.server ?? null,
			desiredQueue: requestDetails?.desiredQueue ?? null,
			lpGain: requestDetails?.lpGain ?? null,
			deadline: requestDetails?.deadline ?? null,
		};
	}

	private mapRequestDetailsFromRecord(
		record: OrderRecord,
	): OrderRequestDetails | null {
		if (
			!record.serviceType ||
			!record.currentLeague ||
			!record.currentDivision ||
			record.currentLp === null ||
			!record.desiredLeague ||
			!record.desiredDivision ||
			!record.server ||
			!record.desiredQueue ||
			record.lpGain === null ||
			!record.deadline
		)
			return null;

		return {
			serviceType: this.mapServiceTypeFromPersistence(record.serviceType),
			currentLeague: record.currentLeague,
			currentDivision: record.currentDivision,
			currentLp: record.currentLp,
			desiredLeague: record.desiredLeague,
			desiredDivision: record.desiredDivision,
			server: record.server,
			desiredQueue: record.desiredQueue,
			lpGain: record.lpGain,
			deadline: record.deadline,
		};
	}

	private mapServiceTypeToPersistence(serviceType: OrderServiceType): string {
		switch (serviceType) {
			case 'elo_boost':
				return 'ELO_BOOST';
			case 'duo_boost':
				return 'DUO_BOOST';
			case 'md5':
				return 'MD5';
			case 'coaching':
				return 'COACHING';
		}
	}

	private mapPricing(order: Order): {
		subtotal: number | null;
		totalAmount: number | null;
		discountAmount: number;
	} {
		return {
			subtotal: order.subtotal,
			totalAmount: order.totalAmount,
			discountAmount: order.discountAmount,
		};
	}

	private mapServiceTypeFromPersistence(serviceType: string): OrderServiceType {
		switch (serviceType) {
			case 'ELO_BOOST':
				return 'elo_boost';
			case 'DUO_BOOST':
				return 'duo_boost';
			case 'MD5':
				return 'md5';
			case 'COACHING':
				return 'coaching';
			default:
				throw new Error(`Invalid order service type persisted: ${serviceType}`);
		}
	}
}
