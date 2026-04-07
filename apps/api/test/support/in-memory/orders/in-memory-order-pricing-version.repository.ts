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

	findActive(): Promise<OrderPricingVersionSnapshot | null> {
		const activeVersion =
			Array.from(this.versions.values()).find(
				(version) => version.status === 'active',
			) ?? null;

		return Promise.resolve(
			activeVersion ? this.cloneVersion(activeVersion) : null,
		);
	}

	findById(id: string): Promise<OrderPricingVersionSnapshot | null> {
		const version = this.versions.get(id) ?? null;
		return Promise.resolve(version ? this.cloneVersion(version) : null);
	}

	list(): Promise<OrderPricingVersionSnapshot[]> {
		return Promise.resolve(
			Array.from(this.versions.values()).map((version) =>
				this.cloneVersion(version),
			),
		);
	}

	createDraft(input: {
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

		return Promise.resolve(this.cloneVersion(version));
	}

	replaceDraft(input: {
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

		return Promise.resolve(this.cloneVersion(updatedVersion));
	}

	activate(input: {
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

		return Promise.resolve(this.cloneVersion(activatedVersion));
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
