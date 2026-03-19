import { PrismaService } from '@app/common/prisma/prisma.service';
import type { OrderRepositoryPort } from '@modules/orders/application/ports/order-repository.port';
import {
	Order,
	type OrderCredentials,
	type OrderRequestDetails,
} from '@modules/orders/domain/order.entity';
import { OrderStatus } from '@modules/orders/domain/order-status';
import { Injectable } from '@nestjs/common';
import type { OrderServiceType } from '@shared/orders/service-type';
import { ensurePersistedEnum } from '@shared/utils/enum.utils';

type OrderRecord = {
	id: string;
	clientId: string | null;
	boosterId: string | null;
	couponId: string | null;
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
	credentials: {
		login: string;
		summonerName: string;
		password: string;
	} | null;
};

type OrderDelegate = {
	findUnique(args: {
		where: { id: string };
		include: { credentials: true };
	}): Promise<OrderRecord | null>;
	findFirst(args: {
		where: { id: string; clientId: string };
		include: { credentials: true };
	}): Promise<OrderRecord | null>;
	findFirst(args: {
		where: { clientId: string };
		select: { id: true };
	}): Promise<{ id: string } | null>;
	create(args: {
		data: {
			id?: string;
			clientId: string | null;
			boosterId: string | null;
			couponId: string | null;
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
		include: { credentials: true };
	}): Promise<OrderRecord>;
	upsert(args: {
		where: { id: string };
		create: {
			id: string;
			clientId: string | null;
			boosterId: string | null;
			couponId: string | null;
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

type OrderPrismaClient = {
	order: OrderDelegate;
	orderCredentials: OrderCredentialsDelegate;
};

@Injectable()
export class PrismaOrderRepository implements OrderRepositoryPort {
	constructor(private readonly prisma: PrismaService) {}

	async create(order: Order): Promise<Order> {
		const record = await this.getDelegate().create({
			data: {
				id: order.id || undefined,
				clientId: order.clientId,
				boosterId: order.boosterId,
				couponId: order.couponId,
				status: order.status,
				...this.mapRequestDetails(order.requestDetails),
				...this.mapPricing(order),
				credentials: this.mapCredentialsCreate(order.credentials),
			},
			include: { credentials: true },
		});

		return this.mapOrderFromRecord(record);
	}

	async findById(id: string): Promise<Order | null> {
		const record = await this.getDelegate().findUnique({
			where: { id },
			include: { credentials: true },
		});
		if (!record) return null;

		return this.mapOrderFromRecord(record);
	}

	async findByIdForClient(id: string, clientId: string): Promise<Order | null> {
		const record = await this.getDelegate().findFirst({
			where: { id, clientId },
			include: { credentials: true },
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

	async save(order: Order): Promise<void> {
		const credentialsCreate = this.mapCredentialsCreate(order.credentials);
		const credentialsUpdate = this.mapCredentialsUpdate(order.credentials);
		if (!order.credentials) {
			await this.getOrderCredentialsDelegate().deleteMany({
				where: { orderId: order.id },
			});
		}

		await this.getDelegate().upsert({
			where: { id: order.id },
			create: {
				id: order.id,
				clientId: order.clientId,
				boosterId: order.boosterId,
				couponId: order.couponId,
				status: order.status,
				...this.mapRequestDetails(order.requestDetails),
				...this.mapPricing(order),
				credentials: credentialsCreate,
			},
			update: {
				clientId: order.clientId,
				boosterId: order.boosterId,
				couponId: order.couponId,
				status: order.status,
				...this.mapRequestDetails(order.requestDetails),
				...this.mapPricing(order),
				credentials: credentialsUpdate,
			},
		});
	}

	private getDelegate(): OrderDelegate {
		return (this.prisma as unknown as OrderPrismaClient).order;
	}

	private getOrderCredentialsDelegate(): OrderCredentialsDelegate {
		return (this.prisma as unknown as OrderPrismaClient).orderCredentials;
	}

	private mapOrderFromRecord(record: OrderRecord): Order {
		return Order.rehydrate({
			id: record.id,
			clientId: record.clientId,
			boosterId: record.boosterId,
			couponId: record.couponId,
			status: ensurePersistedEnum(OrderStatus, record.status, 'order status'),
			credentials: this.mapCredentialsFromRecord(record.credentials),
			requestDetails: this.mapRequestDetailsFromRecord(record),
			subtotal: record.subtotal,
			totalAmount: record.totalAmount,
			discountAmount: record.discountAmount,
		});
	}

	private mapCredentialsFromRecord(
		record: OrderRecord['credentials'],
	): OrderCredentials | null {
		if (!record) return null;

		return {
			login: record.login,
			summonerName: record.summonerName,
			password: record.password,
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
				login: credentials.login,
				summonerName: credentials.summonerName,
				password: credentials.password,
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
					login: credentials.login,
					summonerName: credentials.summonerName,
					password: credentials.password,
				},
				update: {
					login: credentials.login,
					summonerName: credentials.summonerName,
					password: credentials.password,
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
