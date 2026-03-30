import type {
	OrderPricingSnapshot,
	OrderQuoteRequestDetails,
} from '@modules/orders/application/order-pricing';
import type { OrderPricingService } from '@modules/orders/application/services/order-pricing.service';
import {
	OrderRankNotPricedError,
	OrderRankProgressionInvalidError,
	OrderUnsupportedPricingServiceTypeError,
} from '@modules/orders/domain/order-pricing.errors';
import { Injectable } from '@nestjs/common';
import { duoBoostPriceTable } from '@packages/config/orders/duo-boost-price-table';
import { eloBoostPriceTable } from '@packages/config/orders/elo-boost-price-table';
import { orderExtraDefinitions } from '@shared/orders/order-extra';

type PriceEntry = {
	league: string;
	division: string;
	priceToNext: number;
};

@Injectable()
export class StaticOrderPricingService implements OrderPricingService {
	calculate(input: OrderQuoteRequestDetails): OrderPricingSnapshot {
		if (input.serviceType !== 'elo_boost' && input.serviceType !== 'duo_boost')
			throw new OrderUnsupportedPricingServiceTypeError(input.serviceType);

		const priceTable =
			input.serviceType === 'elo_boost'
				? eloBoostPriceTable
				: duoBoostPriceTable;
		const currentEntry = this.findEntry(
			priceTable,
			input.currentLeague,
			input.currentDivision,
		);
		const desiredEntry = this.findEntry(
			priceTable,
			input.desiredLeague,
			input.desiredDivision,
		);

		const currentValue =
			this.getCumulativeValue(priceTable, currentEntry) +
			(currentEntry.priceToNext * input.currentLp) / 100;
		const desiredValue = this.getCumulativeValue(priceTable, desiredEntry);
		const baseSubtotal = Number((desiredValue - currentValue).toFixed(2));

		if (baseSubtotal <= 0) throw new OrderRankProgressionInvalidError();

		const extras = (input.extras ?? []).map((extraType) => {
			const extraDefinition = orderExtraDefinitions.find(
				(candidate) => candidate.type === extraType,
			);
			if (!extraDefinition)
				throw new Error(`Unsupported order extra type: ${extraType}`);

			return {
				type: extraType,
				price: Number((baseSubtotal * extraDefinition.modifierRate).toFixed(2)),
			};
		});
		const extrasTotal = Number(
			extras.reduce((total, extra) => total + extra.price, 0).toFixed(2),
		);
		const subtotal = Number((baseSubtotal + extrasTotal).toFixed(2));

		return {
			subtotal,
			totalAmount: subtotal,
			discountAmount: 0,
			extras,
		};
	}

	private findEntry(
		priceTable: readonly PriceEntry[],
		league: string,
		division: string,
	): PriceEntry {
		const normalizedLeague = league.trim().toLowerCase();
		const normalizedDivision = division.trim().toUpperCase();
		const entry = priceTable.find(
			(item) =>
				item.league === normalizedLeague &&
				item.division === normalizedDivision,
		);
		if (!entry) throw new OrderRankNotPricedError();

		return entry;
	}

	private getCumulativeValue(
		priceTable: readonly PriceEntry[],
		entry: PriceEntry,
	): number {
		const targetIndex = priceTable.findIndex(
			(item) =>
				item.league === entry.league && item.division === entry.division,
		);

		return Number(
			priceTable
				.slice(0, targetIndex)
				.reduce((total, item) => total + item.priceToNext, 0)
				.toFixed(2),
		);
	}
}
