import { ZodValidationPipe } from '@app/common/http/zod-validation.pipe';
import type { AuthenticatedUser } from '@modules/auth/application/authenticated-user';
import { CurrentUser } from '@modules/auth/presentation/decorators/current-user.decorator';
import { Roles } from '@modules/auth/presentation/decorators/roles.decorator';
import { CreateCouponUseCase } from '@modules/orders/application/use-cases/create-coupon/create-coupon.use-case';
import { DisableCouponUseCase } from '@modules/orders/application/use-cases/disable-coupon/disable-coupon.use-case';
import { EnableCouponUseCase } from '@modules/orders/application/use-cases/enable-coupon/enable-coupon.use-case';
import { GetCouponReportUseCase } from '@modules/orders/application/use-cases/get-coupon-report/get-coupon-report.use-case';
import { ListCouponsUseCase } from '@modules/orders/application/use-cases/list-coupons/list-coupons.use-case';
import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { Role } from '@packages/auth/roles/role';
import {
	type CouponIdParamSchemaInput,
	type CreateCouponSchemaInput,
	couponIdParamSchema,
	createCouponSchema,
} from './coupons-admin.request-schemas';

@Controller('admin/coupons')
@Roles(Role.ADMIN)
export class CouponsAdminController {
	constructor(
		private readonly createCoupon: CreateCouponUseCase,
		private readonly listCoupons: ListCouponsUseCase,
		private readonly disableCoupon: DisableCouponUseCase,
		private readonly enableCoupon: EnableCouponUseCase,
		private readonly getCouponReport: GetCouponReportUseCase,
	) {}

	@Post()
	async create(
		@Body(new ZodValidationPipe(createCouponSchema))
		body: CreateCouponSchemaInput,
		@CurrentUser() currentUser: AuthenticatedUser,
	) {
		return await this.createCoupon.execute({
			...body,
			adminUserId: currentUser.id,
		});
	}

	@Get()
	async list(@CurrentUser() _currentUser: AuthenticatedUser) {
		return await this.listCoupons.execute();
	}

	@Post(':couponId/disable')
	@HttpCode(200)
	async disable(
		@Param('couponId', new ZodValidationPipe(couponIdParamSchema))
		couponId: CouponIdParamSchemaInput,
		@CurrentUser() currentUser: AuthenticatedUser,
	) {
		await this.disableCoupon.execute({
			couponId,
			adminUserId: currentUser.id,
		});
		return { ok: true };
	}

	@Post(':couponId/enable')
	@HttpCode(200)
	async enable(
		@Param('couponId', new ZodValidationPipe(couponIdParamSchema))
		couponId: CouponIdParamSchemaInput,
		@CurrentUser() currentUser: AuthenticatedUser,
	) {
		await this.enableCoupon.execute({
			couponId,
			adminUserId: currentUser.id,
		});
		return { ok: true };
	}

	@Get(':couponId/report')
	async report(
		@Param('couponId', new ZodValidationPipe(couponIdParamSchema))
		couponId: CouponIdParamSchemaInput,
		@CurrentUser() _currentUser: AuthenticatedUser,
	) {
		return await this.getCouponReport.execute({ couponId });
	}
}
