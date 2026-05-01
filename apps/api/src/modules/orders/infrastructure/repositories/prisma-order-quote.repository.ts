import { PrismaService } from '@app/common/prisma/prisma.service';
import type { OrderQuoteSnapshot } from '@modules/orders/application/order-pricing';
import type { OrderQuoteRepositoryPort } from '@modules/orders/application/ports/order-quote-repository.port';
import {
	OrderQuoteAlreadyUsedError,
	OrderQuoteExpiredError,
	OrderQuoteNotFoundError,
} from '@modules/orders/domain/order-pricing.errors';
import { Injectable } from '@nestjs/common';
import { isOrderExtraType } from '@packages/shared/orders/order-extra';
import type { OrderServiceType } from '@packages/shared/orders/service-type';
import { ServiceType } from '@prisma/client';

type OrderQuoteRecord = {
	id: string;
	clientId: string;
	couponId: string | null;
	pricingVersionId: string;
	serviceType: string;
	currentLeague: string;
	currentDivision: string;
	currentLp: number;
	desiredLeague: string;
	desiredDivision: string;
	server: string;
	desiredQueue: string;
	lpGain: number;
	deadline: Date;
	subtotal: number;
	totalAmount: number;
	discountAmount: number;
	extras: Array<{
		type: string;
		price: number;
	}>;
	expiresAt: Date;
	consumedAt: Date | null;
	orderId: string | null;
};

@Injectable()
export class PrismaOrderQuoteRepository implements OrderQuoteRepositoryPort {
	constructor(private readonly prisma: PrismaService) {}

	async create(input: {
		clientId: string;
		couponId: string | null;
		requestDetails: OrderQuoteSnapshot['requestDetails'];
		pricing: OrderQuoteSnapshot['pricing'];
		expiresAt: Date;
	}): Promise<{ id: string }> {
		const record = await this.prisma.orderQuote.create({
			data: {
				clientId: input.clientId,
				couponId: input.couponId,
				pricingVersionId: input.pricing.pricingVersionId,
				serviceType: this.mapServiceTypeToPersistence(
					input.requestDetails.serviceType,
				),
				currentLeague: input.requestDetails.currentLeague,
				currentDivision: input.requestDetails.currentDivision,
				currentLp: input.requestDetails.currentLp,
				desiredLeague: input.requestDetails.desiredLeague,
				desiredDivision: input.requestDetails.desiredDivision,
				server: input.requestDetails.server,
				desiredQueue: input.requestDetails.desiredQueue,
				lpGain: input.requestDetails.lpGain,
				deadline: input.requestDetails.deadline,
				subtotal: input.pricing.subtotal,
				totalAmount: input.pricing.totalAmount,
				discountAmount: input.pricing.discountAmount,
				extras:
					input.pricing.extras.length === 0
						? undefined
						: {
								create: input.pricing.extras.map((extra) => ({
									type: extra.type,
									price: extra.price,
								})),
							},
				expiresAt: input.expiresAt,
			},
			select: { id: true },
		});

		return { id: record.id };
	}

	async consumeByIdForClient(input: {
		quoteId: string;
		clientId: string;
		now: Date;
		orderId: string;
	}): Promise<OrderQuoteSnapshot> {
		const quote = await this.prisma.orderQuote.findFirst({
			where: {
				id: input.quoteId,
				clientId: input.clientId,
			},
			include: { extras: true },
		});
		if (!quote) throw new OrderQuoteNotFoundError();
		if (quote.consumedAt) throw new OrderQuoteAlreadyUsedError();
		if (quote.expiresAt <= input.now) throw new OrderQuoteExpiredError();

		const result = await this.prisma.orderQuote.updateMany({
			where: {
				id: input.quoteId,
				clientId: input.clientId,
				consumedAt: null,
				expiresAt: {
					gt: input.now,
				},
			},
			data: {
				consumedAt: input.now,
				orderId: input.orderId,
			},
		});
		if (result.count === 0) throw new OrderQuoteAlreadyUsedError();

		return this.mapSnapshot(quote);
	}

	async restoreConsumedByIdForClient(input: {
		quoteId: string;
		clientId: string;
		orderId: string;
	}): Promise<void> {
		await this.prisma.orderQuote.updateMany({
			where: {
				id: input.quoteId,
				clientId: input.clientId,
				orderId: input.orderId,
			},
			data: {
				consumedAt: null,
				orderId: null,
			},
		});
	}

	private mapSnapshot(record: OrderQuoteRecord): OrderQuoteSnapshot {
		return {
			couponId: record.couponId,
			requestDetails: {
				serviceType: this.mapServiceTypeFromPersistence(record.serviceType),
				extras: record.extras.map((extra) => {
					if (!isOrderExtraType(extra.type))
						throw new Error(
							`Invalid order extra type persisted: ${extra.type}`,
						);

					return extra.type;
				}),
				currentLeague: record.currentLeague,
				currentDivision: record.currentDivision,
				currentLp: record.currentLp,
				desiredLeague: record.desiredLeague,
				desiredDivision: record.desiredDivision,
				server: record.server,
				desiredQueue: record.desiredQueue,
				lpGain: record.lpGain,
				deadline: record.deadline,
			},
			pricing: {
				pricingVersionId: record.pricingVersionId,
				subtotal: record.subtotal,
				totalAmount: record.totalAmount,
				discountAmount: record.discountAmount,
				extras: record.extras.map((extra) => {
					if (!isOrderExtraType(extra.type))
						throw new Error(
							`Invalid order extra type persisted: ${extra.type}`,
						);

					return {
						type: extra.type,
						price: extra.price,
					};
				}),
			},
		};
	}

	private mapServiceTypeFromPersistence(serviceType: string): OrderServiceType {
		switch (serviceType) {
			case ServiceType.ELO_BOOST:
				return 'elo_boost';
			case ServiceType.DUO_BOOST:
				return 'duo_boost';
			case ServiceType.MD5:
				return 'md5';
			case ServiceType.COACHING:
				return 'coaching';
			default:
				throw new Error(`Invalid order service type persisted: ${serviceType}`);
		}
	}

	private mapServiceTypeToPersistence(
		serviceType: OrderServiceType,
	): ServiceType {
		switch (serviceType) {
			case 'elo_boost':
				return ServiceType.ELO_BOOST;
			case 'duo_boost':
				return ServiceType.DUO_BOOST;
			case 'md5':
				return ServiceType.MD5;
			case 'coaching':
				return ServiceType.COACHING;
		}
	}
}
