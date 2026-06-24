import { ZodValidationPipe } from '@app/common/http/zod-validation.pipe';
import type { AuthenticatedUser } from '@modules/auth/application/authenticated-user';
import { CurrentUser } from '@modules/auth/presentation/decorators/current-user.decorator';
import { Roles } from '@modules/auth/presentation/decorators/roles.decorator';
import { JwtAuthGuard } from '@modules/auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/presentation/guards/roles.guard';
import { GetOrderRatingsUseCase } from '@modules/ratings/application/use-cases/get-order-ratings/get-order-ratings.use-case';
import { SubmitRatingUseCase } from '@modules/ratings/application/use-cases/submit-rating/submit-rating.use-case';
import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Role } from '@packages/auth/roles/role';
import {
	type OrderIdParamSchemaInput,
	orderIdParamSchema,
	type SubmitRatingSchemaInput,
	submitRatingSchema,
} from './ratings.request-schemas';

@Controller('ratings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CLIENT, Role.BOOSTER)
export class RatingsController {
	constructor(
		private readonly submitRating: SubmitRatingUseCase,
		private readonly getOrderRatings: GetOrderRatingsUseCase,
	) {}

	@Post()
	async submit(
		@Body(new ZodValidationPipe(submitRatingSchema))
		body: SubmitRatingSchemaInput,
		@CurrentUser() currentUser: AuthenticatedUser,
	) {
		return await this.submitRating.execute({
			raterId: currentUser.id,
			orderId: body.orderId,
			score: body.score,
			comment: body.comment,
		});
	}

	@Get('orders/:orderId')
	async listForOrder(
		@Param('orderId', new ZodValidationPipe(orderIdParamSchema))
		orderId: OrderIdParamSchemaInput,
		@CurrentUser() currentUser: AuthenticatedUser,
	) {
		return await this.getOrderRatings.execute({
			orderId,
			requesterId: currentUser.id,
		});
	}
}
