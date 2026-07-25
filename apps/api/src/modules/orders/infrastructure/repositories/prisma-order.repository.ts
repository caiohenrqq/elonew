import { PrismaService } from '@app/common/prisma/prisma.service';
import type {
	BoosterOrderDashboardSnapshot,
	BoosterOrderReaderPort,
} from '@modules/orders/application/ports/booster-order-reader.port';
import type {
	ClientOrderDetailsSnapshot,
	ClientOrderDashboardSnapshot,
	ClientOrderReaderPort,
} from '@modules/orders/application/ports/client-order-reader.port';
import type { OrderRepositoryPort } from '@modules/orders/application/ports/order-repository.port';
import {
	Order,
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
	summonerName: string | null;
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
	completedAt: Date | null;
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

type DashboardOrderRecord = Omit<OrderRecord, 'credentials'> & {
	createdAt: Date;
	credentials?: { summonerName: string } | null;
};

type ClientOrderDetailsRecord = Omit<OrderRecord, 'credentials'> & {
	credentials: { id: string } | null;
	booster: {
		username: string;
		profile: { avatarUrl: string | null; reputation: number } | null;
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
		where: { id: string; clientId: string };
		include: {
			credentials: { select: { id: true } };
			extras: true;
			booster: {
				select: {
					username: true;
					profile: { select: { avatarUrl: true; reputation: true } };
				};
			};
		};
	}): Promise<ClientOrderDetailsRecord | null>;
	findFirst(args: {
		where: { clientId: string };
		select: { id: true };
	}): Promise<{ id: string } | null>;
	findMany(args: {
		where:
			| { clientId: string }
			| {
					status: string;
					credentials?: { isNot: null };
					OR?: Array<{ boosterId: string | null }>;
					boosterId?: string;
					boosterRejections?: { none: { boosterId: string } };
			  };
		include:
			| { extras: true }
			| {
					extras: true;
					credentials: { select: { summonerName: true } };
			  };
		orderBy: { createdAt: 'desc' };
		take?: number;
	}): Promise<DashboardOrderRecord[]>;
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
			summonerName: string | null;
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
			completedAt?: Date | null;
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
			summonerName: string | null;
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
			completedAt?: Date | null;
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
			summonerName: string | null;
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
			completedAt?: Date | null;
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
	update(args: {
		where: { id: string; status: { in: string[] } };
		data: {
			summonerName: string | null;
			credentials: {
				upsert: {
					create: { login: string; summonerName: string; password: string };
					update: { login: string; summonerName: string; password: string };
				};
			};
		};
	}): Promise<unknown>;
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
				completedAt: order.completedAt,
				extras: this.mapExtrasCreate(order.extras),
				credentials: this.mapCredentialsCreate(order),
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

	async findDetailsForClient(
		orderId: string,
		clientId: string,
	): Promise<ClientOrderDetailsSnapshot | null> {
		const record = await this.getDelegate().findFirst({
			where: { id: orderId, clientId },
			include: {
				credentials: { select: { id: true } },
				extras: true,
				booster: {
					select: {
						username: true,
						profile: { select: { avatarUrl: true, reputation: true } },
					},
				},
			},
		});
		if (!record) return null;

		const { credentials, booster, ...dashboardRecord } = record;
		const {
			clientId: _clientId,
			createdAt: _createdAt,
			...details
		} = this.mapDashboardSnapshotFromRecord({
			...dashboardRecord,
			createdAt: new Date(0),
		});
		return {
			...details,
			hasCredentials: credentials !== null,
			summonerName: record.summonerName,
			extras: record.extras.map((extra) => this.mapExtraFromRecord(extra)),
			booster: booster
				? {
						username: booster.username,
						avatarUrl: booster.profile?.avatarUrl ?? null,
						reputation: booster.profile?.reputation ?? 0,
					}
				: null,
		};
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
	): Promise<BoosterOrderDashboardSnapshot[]> {
		const records = await this.getDelegate().findMany({
			where: {
				status: OrderStatus.PENDING_BOOSTER,
				credentials: { isNot: null },
				OR: [{ boosterId: null }, { boosterId }],
				boosterRejections: { none: { boosterId } },
			},
			include: {
				extras: true,
				credentials: { select: { summonerName: true } },
			},
			orderBy: { createdAt: 'desc' },
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
			include: {
				extras: true,
				credentials: { select: { summonerName: true } },
			},
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
			include: {
				extras: true,
				credentials: { select: { summonerName: true } },
			},
			orderBy: { createdAt: 'desc' },
			take: limit,
		});

		return records.map((record) =>
			this.mapBoosterDashboardSnapshotFromRecord(record),
		);
	}

	async save(order: Order): Promise<void> {
		await this.prisma.$transaction(async (tx) => {
			await this.saveWithClient(order, tx as unknown as OrderPrismaClient);
		});
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

	// A full-row upsert would write back the status, booster assignment and
	// extras read before the form was submitted, reverting a booster who
	// accepted the order in the meantime. Only the credential fields are
	// written here, and only while the order still allows storing them.
	async saveCredentials(order: Order): Promise<void> {
		const credentials = this.mapCredentialsUpdate(order);
		if (!credentials)
			throw new Error('Cannot save an order without pending credentials.');

		await this.getDelegate().update({
			where: {
				id: order.id,
				status: {
					in: [OrderStatus.PENDING_BOOSTER, OrderStatus.IN_PROGRESS],
				},
			},
			data: {
				summonerName: order.requestDetails?.summonerName || null,
				credentials,
			},
		});
	}

	private async saveWithClient(
		order: Order,
		client: OrderPrismaClient,
	): Promise<void> {
		const credentialsCreate = this.mapCredentialsCreate(order);
		const credentialsUpdate = this.mapCredentialsUpdate(order);
		if (!order.hasCredentials) {
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
				completedAt: order.completedAt,
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
				completedAt: order.completedAt,
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
			hasStoredCredentials: record.credentials !== null,
			requestDetails: this.mapRequestDetailsFromRecord(record),
			subtotal: record.subtotal,
			totalAmount: record.totalAmount,
			discountAmount: record.discountAmount,
			completedAt: record.completedAt,
			extras: (record.extras ?? []).map((extra) =>
				this.mapExtraFromRecord(extra),
			),
		});
	}

	private mapDashboardSnapshotFromRecord(
		record: DashboardOrderRecord,
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
		record: DashboardOrderRecord,
	): BoosterOrderDashboardSnapshot {
		const totalAmount = record.totalAmount;

		return {
			id: record.id,
			boosterId: record.boosterId,
			status: ensurePersistedEnum(OrderStatus, record.status, 'order status'),
			serviceType: record.serviceType
				? this.mapServiceTypeFromPersistence(record.serviceType)
				: null,
			summonerName:
				record.summonerName ??
				(record.credentials
					? this.orderCredentialsCipher.decryptField(
							record.id,
							'summonerName',
							record.credentials.summonerName,
						)
					: null),
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
			extras: record.extras.map((extra) => this.mapExtraFromRecord(extra)),
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

	private sealCredentials(order: Order): {
		login: string;
		summonerName: string;
		password: string;
	} | null {
		const credentials = order.pendingCredentials;
		if (!credentials) return null;

		return {
			login: this.orderCredentialsCipher.encryptField(
				order.id,
				'login',
				credentials.login,
			),
			summonerName: this.orderCredentialsCipher.encryptField(
				order.id,
				'summonerName',
				credentials.summonerName,
			),
			password: this.orderCredentialsCipher.encryptField(
				order.id,
				'password',
				credentials.password,
			),
		};
	}

	private mapCredentialsCreate(order: Order):
		| {
				create: {
					login: string;
					summonerName: string;
					password: string;
				};
		  }
		| undefined {
		const sealed = this.sealCredentials(order);
		if (!sealed) return undefined;

		return { create: sealed };
	}

	private mapCredentialsUpdate(order: Order):
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
		const sealed = this.sealCredentials(order);
		if (!sealed) return undefined;

		return { upsert: { create: sealed, update: sealed } };
	}

	private mapRequestDetails(requestDetails: OrderRequestDetails | null): {
		serviceType: string | null;
		summonerName: string | null;
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
			summonerName: requestDetails?.summonerName || null,
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
			record.lpGain === null
		)
			return null;

		return {
			serviceType: this.mapServiceTypeFromPersistence(record.serviceType),
			summonerName: record.summonerName ?? '',
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
