import type {
	CouponAdminRepositoryPort,
	CouponSummary,
} from '@modules/orders/application/ports/coupon-admin-repository.port';
import { CouponNotFoundError } from '@modules/orders/domain/order-pricing.errors';
import { EnableCouponUseCase } from './enable-coupon.use-case';

const couponSummary = (overrides: Partial<CouponSummary> = {}): CouponSummary =>
	({ id: 'coupon-1', code: 'SAVE10', ...overrides }) as CouponSummary;

class FakeCouponAdminRepository
	implements Pick<CouponAdminRepositoryPort, 'findById' | 'enable'>
{
	coupon: CouponSummary | null = couponSummary();
	enableResult = true;
	readonly enableCalls: Array<{ id: string; adminUserId: string }> = [];

	async findById(): Promise<CouponSummary | null> {
		return this.coupon;
	}

	async enable(id: string, adminUserId: string): Promise<boolean> {
		this.enableCalls.push({ id, adminUserId });
		return this.enableResult;
	}
}

class CouponLifecycleLoggerSpy {
	readonly events: unknown[] = [];
	emit(event: unknown): void {
		this.events.push(event);
	}
}

const buildUseCase = (repository: FakeCouponAdminRepository) => {
	const logger = new CouponLifecycleLoggerSpy();
	const useCase = new EnableCouponUseCase(
		repository as unknown as CouponAdminRepositoryPort,
		logger as never,
	);
	return { useCase, logger };
};

describe('EnableCouponUseCase', () => {
	it('enables the coupon and logs a success lifecycle event', async () => {
		const repository = new FakeCouponAdminRepository();
		const { useCase, logger } = buildUseCase(repository);

		await useCase.execute({ couponId: 'coupon-1', adminUserId: 'admin-1' });

		expect(repository.enableCalls).toEqual([
			{ id: 'coupon-1', adminUserId: 'admin-1' },
		]);
		expect(logger.events).toEqual([
			expect.objectContaining({
				event: 'coupon.lifecycle',
				operation: 'enable',
				outcome: 'success',
				coupon_code: 'SAVE10',
				side_effects: ['coupon_enabled'],
			}),
		]);
	});

	it('marks the outcome as skipped when the coupon is already active', async () => {
		const repository = new FakeCouponAdminRepository();
		repository.enableResult = false;
		const { useCase, logger } = buildUseCase(repository);

		await useCase.execute({ couponId: 'coupon-1', adminUserId: 'admin-1' });

		expect(logger.events).toEqual([
			expect.objectContaining({ outcome: 'skipped', side_effects: [] }),
		]);
	});

	it('throws when the coupon does not exist', async () => {
		const repository = new FakeCouponAdminRepository();
		repository.coupon = null;
		const { useCase } = buildUseCase(repository);

		await expect(
			useCase.execute({ couponId: 'missing', adminUserId: 'admin-1' }),
		).rejects.toBeInstanceOf(CouponNotFoundError);
	});
});
