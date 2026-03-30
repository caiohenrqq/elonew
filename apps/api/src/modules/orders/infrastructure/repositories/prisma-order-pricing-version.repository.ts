import { PrismaService } from '@app/common/prisma/prisma.service';
import type {
	OrderPricingExtraRate,
	OrderPricingStep,
	OrderPricingVersionSnapshot,
} from '@modules/orders/application/order-pricing-version';
import type { OrderPricingVersionRepositoryPort } from '@modules/orders/application/ports/order-pricing-version-repository.port';
import {
	OrderPricingVersionActiveConflictError,
	OrderPricingVersionImmutableError,
	OrderPricingVersionNotFoundError,
} from '@modules/orders/domain/order-pricing.errors';
import { Injectable } from '@nestjs/common';
import { Prisma, ServiceType } from '@prisma/client';
import type { OrderExtraType } from '@shared/orders/order-extra';
import {
	orderRankProgression,
	type RankPricedOrderServiceType,
} from '@shared/orders/order-rank-progression';

type PricingVersionRecord = {
	id: string;
	name: string;
	status: string;
	createdAt: Date;
	updatedAt: Date;
	activatedAt: Date | null;
	steps: Array<{
		serviceType: string;
		league: string;
		division: string;
		priceToNext: number;
	}>;
	extras: Array<{
		type: string;
		modifierRate: number;
	}>;
};

type PricingVersionDelegate = {
	findFirst(args: {
		where: { status: string };
		include: { steps: true; extras: true };
	}): Promise<PricingVersionRecord | null>;
	findUnique(args: {
		where: { id: string };
		include: { steps: true; extras: true };
	}): Promise<PricingVersionRecord | null>;
	findMany(args: {
		where?: { status?: string };
		include: { steps: true; extras: true };
		orderBy: { createdAt: 'asc' | 'desc' } | { activatedAt: 'asc' | 'desc' };
		take?: number;
	}): Promise<PricingVersionRecord[]>;
	create(args: {
		data: {
			name: string;
			status: string;
			steps?: {
				create: Array<{
					serviceType: ServiceType;
					league: string;
					division: string;
					priceToNext: number;
				}>;
			};
			extras?: {
				create: Array<{
					type: string;
					modifierRate: number;
				}>;
			};
		};
		include: { steps: true; extras: true };
	}): Promise<PricingVersionRecord>;
	update(args: {
		where: { id: string };
		data: {
			name?: string;
			status?: string;
			activatedAt?: Date | null;
			steps?: {
				deleteMany: Record<string, never>;
				create: Array<{
					serviceType: ServiceType;
					league: string;
					division: string;
					priceToNext: number;
				}>;
			};
			extras?: {
				deleteMany: Record<string, never>;
				create: Array<{
					type: string;
					modifierRate: number;
				}>;
			};
		};
		include: { steps: true; extras: true };
	}): Promise<PricingVersionRecord>;
	updateMany(args: {
		where: { status: string };
		data: { status: string };
	}): Promise<{ count: number }>;
};

type PricingVersionPrismaClient = {
	pricingVersion: PricingVersionDelegate;
	$transaction<T>(
		callback: (tx: PricingVersionPrismaClient) => Promise<T>,
	): Promise<T>;
};

@Injectable()
export class PrismaOrderPricingVersionRepository
	implements OrderPricingVersionRepositoryPort
{
	constructor(private readonly prisma: PrismaService) {}

	async findActive(): Promise<OrderPricingVersionSnapshot | null> {
		const versions = await this.getDelegate().findMany({
			where: { status: 'ACTIVE' },
			include: { steps: true, extras: true },
			orderBy: { activatedAt: 'desc' },
			take: 2,
		});
		if (versions.length > 1) throw new OrderPricingVersionActiveConflictError();

		return versions[0] ? this.mapVersion(versions[0]) : null;
	}

	async findById(id: string): Promise<OrderPricingVersionSnapshot | null> {
		const version = await this.getDelegate().findUnique({
			where: { id },
			include: { steps: true, extras: true },
		});

		return version ? this.mapVersion(version) : null;
	}

	async list(): Promise<OrderPricingVersionSnapshot[]> {
		const versions = await this.getDelegate().findMany({
			include: { steps: true, extras: true },
			orderBy: { createdAt: 'desc' },
		});

		return versions.map((version) => this.mapVersion(version));
	}

	async createDraft(input: {
		name: string;
		steps: OrderPricingStep[];
		extras: OrderPricingExtraRate[];
	}): Promise<OrderPricingVersionSnapshot> {
		const version = await this.getDelegate().create({
			data: {
				name: input.name,
				status: 'DRAFT',
				steps:
					input.steps.length === 0
						? undefined
						: {
								create: input.steps.map((step) => ({
									serviceType: this.mapServiceTypeToPersistence(
										step.serviceType,
									),
									league: step.league,
									division: step.division,
									priceToNext: step.priceToNext,
								})),
							},
				extras:
					input.extras.length === 0
						? undefined
						: {
								create: input.extras.map((extra) => ({
									type: extra.type,
									modifierRate: extra.modifierRate,
								})),
							},
			},
			include: { steps: true, extras: true },
		});

		return this.mapVersion(version);
	}

	async replaceDraft(input: {
		versionId: string;
		name: string;
		steps: OrderPricingStep[];
		extras: OrderPricingExtraRate[];
	}): Promise<OrderPricingVersionSnapshot> {
		const existingVersion = await this.getDelegate().findUnique({
			where: { id: input.versionId },
			include: { steps: true, extras: true },
		});
		if (!existingVersion) throw new OrderPricingVersionNotFoundError();
		if (existingVersion.status !== 'DRAFT')
			throw new OrderPricingVersionImmutableError();

		const version = await this.getDelegate().update({
			where: { id: input.versionId },
			data: {
				name: input.name,
				steps: {
					deleteMany: {},
					create: input.steps.map((step) => ({
						serviceType: this.mapServiceTypeToPersistence(step.serviceType),
						league: step.league,
						division: step.division,
						priceToNext: step.priceToNext,
					})),
				},
				extras: {
					deleteMany: {},
					create: input.extras.map((extra) => ({
						type: extra.type,
						modifierRate: extra.modifierRate,
					})),
				},
			},
			include: { steps: true, extras: true },
		});

		return this.mapVersion(version);
	}

	async activate(input: {
		versionId: string;
		activatedAt: Date;
	}): Promise<OrderPricingVersionSnapshot> {
		try {
			return await this.getClient().$transaction(async (tx) => {
				const targetVersion = await tx.pricingVersion.findUnique({
					where: { id: input.versionId },
					include: { steps: true, extras: true },
				});
				if (!targetVersion) throw new OrderPricingVersionNotFoundError();
				if (targetVersion.status !== 'DRAFT')
					throw new OrderPricingVersionImmutableError();

				await tx.pricingVersion.updateMany({
					where: { status: 'ACTIVE' },
					data: { status: 'ARCHIVED' },
				});

				const activatedVersion = await tx.pricingVersion.update({
					where: { id: input.versionId },
					data: {
						status: 'ACTIVE',
						activatedAt: input.activatedAt,
					},
					include: { steps: true, extras: true },
				});

				return this.mapVersion(activatedVersion);
			});
		} catch (error) {
			if (
				error instanceof Prisma.PrismaClientKnownRequestError &&
				error.code === 'P2002'
			)
				throw new OrderPricingVersionActiveConflictError();

			throw error;
		}
	}

	private getClient(): PricingVersionPrismaClient {
		return this.prisma as unknown as PricingVersionPrismaClient;
	}

	private getDelegate(): PricingVersionDelegate {
		return this.getClient().pricingVersion;
	}

	private mapVersion(
		record: PricingVersionRecord,
	): OrderPricingVersionSnapshot {
		const progressionOrder = new Map(
			orderRankProgression.map((step, index) => [
				`${step.league}:${step.division}`,
				index,
			]),
		);

		return {
			id: record.id,
			name: record.name,
			status: this.mapStatusFromPersistence(record.status),
			createdAt: record.createdAt,
			updatedAt: record.updatedAt,
			activatedAt: record.activatedAt,
			steps: record.steps
				.map((step) => ({
					serviceType: this.mapServiceTypeFromPersistence(step.serviceType),
					league: step.league,
					division: step.division,
					priceToNext: step.priceToNext,
				}))
				.sort((left, right) => {
					if (left.serviceType !== right.serviceType)
						return left.serviceType.localeCompare(right.serviceType);

					const leftIndex =
						progressionOrder.get(`${left.league}:${left.division}`) ??
						Number.MAX_SAFE_INTEGER;
					const rightIndex =
						progressionOrder.get(`${right.league}:${right.division}`) ??
						Number.MAX_SAFE_INTEGER;

					return leftIndex - rightIndex;
				}),
			extras: record.extras.map((extra) => ({
				type: extra.type as OrderExtraType,
				modifierRate: extra.modifierRate,
			})),
		};
	}

	private mapStatusFromPersistence(
		status: string,
	): 'draft' | 'active' | 'archived' {
		switch (status) {
			case 'DRAFT':
				return 'draft';
			case 'ACTIVE':
				return 'active';
			case 'ARCHIVED':
				return 'archived';
			default:
				throw new Error(`Invalid pricing version status persisted: ${status}`);
		}
	}

	private mapServiceTypeFromPersistence(
		serviceType: string,
	): RankPricedOrderServiceType {
		switch (serviceType) {
			case ServiceType.ELO_BOOST:
				return 'elo_boost';
			case ServiceType.DUO_BOOST:
				return 'duo_boost';
			default:
				throw new Error(
					`Invalid pricing service type persisted: ${serviceType}`,
				);
		}
	}

	private mapServiceTypeToPersistence(
		serviceType: RankPricedOrderServiceType,
	): ServiceType {
		switch (serviceType) {
			case 'elo_boost':
				return ServiceType.ELO_BOOST;
			case 'duo_boost':
				return ServiceType.DUO_BOOST;
		}
	}
}
