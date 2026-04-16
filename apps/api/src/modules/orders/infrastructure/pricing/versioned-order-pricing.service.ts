import type {
	OrderPricingSnapshot,
	OrderQuoteRequestDetails,
} from '@modules/orders/application/order-pricing';
import type { OrderPricingVersionSnapshot } from '@modules/orders/application/order-pricing-version';
import {
	ORDER_PRICING_VERSION_REPOSITORY_KEY,
	type OrderPricingVersionRepositoryPort,
} from '@modules/orders/application/ports/order-pricing-version-repository.port';
import type { OrderPricingService } from '@modules/orders/application/services/order-pricing.service';
import {
	OrderPricingVersionIncompleteError,
	OrderPricingVersionNotActiveError,
	OrderRankNotPricedError,
	OrderRankProgressionInvalidError,
	OrderUnsupportedPricingServiceTypeError,
} from '@modules/orders/domain/order-pricing.errors';
import { Inject, Injectable } from '@nestjs/common';
import { isOrderExtraType } from '@shared/orders/order-extra';

type PriceEntry = {
	league: string;
	division: string;
	priceToNext: number;
};

@Injectable()
export class VersionedOrderPricingService implements OrderPricingService {
	constructor(
		@Inject(ORDER_PRICING_VERSION_REPOSITORY_KEY)
		private readonly pricingVersions: OrderPricingVersionRepositoryPort,
	) {}

	async calculate(
		input: OrderQuoteRequestDetails,
	): Promise<OrderPricingSnapshot> {
		if (input.serviceType !== 'elo_boost' && input.serviceType !== 'duo_boost')
			throw new OrderUnsupportedPricingServiceTypeError(input.serviceType);

		const activeVersion = await this.pricingVersions.findActive();
		if (!activeVersion) throw new OrderPricingVersionNotActiveError();

		const priceTable = this.getPriceTable(activeVersion, input.serviceType);
		const currentEntry = this.findEntry(
			priceTable,
			input.currentLeague,
			input.currentDivision,
		);
		if (!currentEntry) throw new OrderRankNotPricedError();

		const desiredEntry = this.findEntry(
			priceTable,
			input.desiredLeague,
			input.desiredDivision,
		);
		const currentValue =
			this.getCumulativeValue(priceTable, currentEntry) +
			(currentEntry.priceToNext * input.currentLp) / 100;
		const desiredValue = this.getTargetValue(
			priceTable,
			input.desiredLeague,
			input.desiredDivision,
			desiredEntry,
		);
		const baseSubtotal = Number((desiredValue - currentValue).toFixed(2));
		if (baseSubtotal <= 0) throw new OrderRankProgressionInvalidError();

		const extras = (input.extras ?? []).map((extraType) => {
			if (!isOrderExtraType(extraType))
				throw new OrderPricingVersionIncompleteError();

			const extraDefinition = activeVersion.extras.find(
				(candidate) => candidate.type === extraType,
			);
			if (!extraDefinition) throw new OrderPricingVersionIncompleteError();

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
			pricingVersionId: activeVersion.id,
			subtotal,
			totalAmount: subtotal,
			discountAmount: 0,
			extras,
		};
	}

	private getPriceTable(
		version: OrderPricingVersionSnapshot,
		serviceType: 'elo_boost' | 'duo_boost',
	): PriceEntry[] {
		const priceTable = version.steps
			.filter((step) => step.serviceType === serviceType)
			.map((step) => ({
				league: step.league,
				division: step.division,
				priceToNext: step.priceToNext,
			}));
		if (priceTable.length === 0) throw new OrderRankNotPricedError();

		return priceTable;
	}

	private findEntry(
		priceTable: readonly PriceEntry[],
		league: string,
		division: string,
	): PriceEntry | null {
		const normalizedLeague = league.trim().toLowerCase();
		const normalizedDivision = division.trim().toUpperCase();
		const entry = priceTable.find(
			(item) =>
				item.league === normalizedLeague &&
				item.division === normalizedDivision,
		);

		return entry ?? null;
	}

	private getCumulativeValue(
		priceTable: readonly PriceEntry[],
		entry: PriceEntry | null,
	): number {
		if (!entry) throw new OrderRankNotPricedError();

		const targetIndex = priceTable.findIndex(
			(item) =>
				item.league === entry.league && item.division === entry.division,
		);
		if (targetIndex < 0) throw new OrderRankNotPricedError();

		return Number(
			priceTable
				.slice(0, targetIndex)
				.reduce((total, item) => total + item.priceToNext, 0)
				.toFixed(2),
		);
	}

	private getTargetValue(
		priceTable: readonly PriceEntry[],
		league: string,
		division: string,
		entry: PriceEntry | null,
	): number {
		if (entry) return this.getCumulativeValue(priceTable, entry);

		if (this.isMasterRank(league, division)) {
			return Number(
				priceTable
					.reduce((total, item) => total + item.priceToNext, 0)
					.toFixed(2),
			);
		}

		throw new OrderRankNotPricedError();
	}

	private isMasterRank(league: string, division: string): boolean {
		return (
			league.trim().toLowerCase() === 'master' &&
			division.trim().toUpperCase() === 'MASTER'
		);
	}
}
