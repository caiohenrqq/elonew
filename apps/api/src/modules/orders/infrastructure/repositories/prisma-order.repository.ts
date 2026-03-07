import { PrismaService } from '@app/common/prisma/prisma.service';
import type { OrderRepositoryPort } from '@modules/orders/application/ports/order-repository.port';
import {
	Order,
	type OrderCredentials,
} from '@modules/orders/domain/order.entity';
import { OrderStatus } from '@modules/orders/domain/order-status';
import { Injectable } from '@nestjs/common';
import { ensurePersistedEnum } from '@shared/utils/enum.utils';

type OrderRecord = {
	id: string;
	status: string;
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
	upsert(args: {
		where: { id: string };
		create: {
			id: string;
			status: string;
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
			status: string;
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

	async findById(id: string): Promise<Order | null> {
		const record = await this.getDelegate().findUnique({
			where: { id },
			include: { credentials: true },
		});
		if (!record) return null;

		return Order.rehydrate({
			id: record.id,
			status: ensurePersistedEnum(OrderStatus, record.status, 'order status'),
			credentials: this.mapCredentialsFromRecord(record.credentials),
		});
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
				status: order.status,
				credentials: credentialsCreate,
			},
			update: {
				status: order.status,
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
}
