import type {
	OrderPricingExtraRate,
	OrderPricingStep,
	OrderPricingVersionSnapshot,
} from '@modules/orders/application/order-pricing-version';
import type { OrderPricingVersionRepositoryPort } from '@modules/orders/application/ports/order-pricing-version-repository.port';
import {
	OrderPricingVersionImmutableError,
	OrderPricingVersionNotFoundError,
} from '@modules/orders/domain/order-pricing.errors';

type StoredPricingVersion = OrderPricingVersionSnapshot;

export class InMemoryOrderPricingVersionRepository
	implements OrderPricingVersionRepositoryPort
{
	private readonly versions = new Map<string, StoredPricingVersion>();
	private nextId = 1;

	async findActive(): Promise<OrderPricingVersionSnapshot | null> {
		const activeVersion =
			Array.from(this.versions.values()).find(
				(version) => version.status === 'active',
			) ?? null;

		return activeVersion ? this.cloneVersion(activeVersion) : null;
	}

	async findById(id: string): Promise<OrderPricingVersionSnapshot | null> {
		const version = this.versions.get(id) ?? null;
		return version ? this.cloneVersion(version) : null;
	}

	async list(): Promise<OrderPricingVersionSnapshot[]> {
		return Array.from(this.versions.values()).map((version) =>
			this.cloneVersion(version),
		);
	}

	async createDraft(input: {
		name: string;
		steps: OrderPricingStep[];
		extras: OrderPricingExtraRate[];
	}): Promise<OrderPricingVersionSnapshot> {
		const now = new Date();
		const version: StoredPricingVersion = {
			id: `pricing-version-${this.nextId++}`,
			name: input.name,
			status: 'draft',
			createdAt: now,
			updatedAt: now,
			activatedAt: null,
			steps: input.steps.map((step) => ({ ...step })),
			extras: input.extras.map((extra) => ({ ...extra })),
		};
		this.versions.set(version.id, version);

		return this.cloneVersion(version);
	}

	async replaceDraft(input: {
		versionId: string;
		name: string;
		steps: OrderPricingStep[];
		extras: OrderPricingExtraRate[];
	}): Promise<OrderPricingVersionSnapshot> {
		const version = this.versions.get(input.versionId);
		if (!version) throw new OrderPricingVersionNotFoundError();
		if (version.status !== 'draft')
			throw new OrderPricingVersionImmutableError();

		const updatedVersion: StoredPricingVersion = {
			...version,
			name: input.name,
			updatedAt: new Date(),
			steps: input.steps.map((step) => ({ ...step })),
			extras: input.extras.map((extra) => ({ ...extra })),
		};
		this.versions.set(updatedVersion.id, updatedVersion);

		return this.cloneVersion(updatedVersion);
	}

	async activate(input: {
		versionId: string;
		activatedAt: Date;
	}): Promise<OrderPricingVersionSnapshot> {
		const targetVersion = this.versions.get(input.versionId);
		if (!targetVersion) throw new OrderPricingVersionNotFoundError();
		if (targetVersion.status !== 'draft')
			throw new OrderPricingVersionImmutableError();

		for (const [versionId, version] of this.versions.entries()) {
			if (version.status !== 'active') continue;
			this.versions.set(versionId, {
				...version,
				status: 'archived',
				updatedAt: input.activatedAt,
			});
		}

		const activatedVersion: StoredPricingVersion = {
			...targetVersion,
			status: 'active',
			updatedAt: input.activatedAt,
			activatedAt: input.activatedAt,
		};
		this.versions.set(activatedVersion.id, activatedVersion);

		return this.cloneVersion(activatedVersion);
	}

	private cloneVersion(
		version: StoredPricingVersion,
	): OrderPricingVersionSnapshot {
		return {
			...version,
			createdAt: new Date(version.createdAt),
			updatedAt: new Date(version.updatedAt),
			activatedAt: version.activatedAt ? new Date(version.activatedAt) : null,
			steps: version.steps.map((step) => ({ ...step })),
			extras: version.extras.map((extra) => ({ ...extra })),
		};
	}
}
