import { PrismaModule } from '@app/common/prisma/prisma.module';
import { AuthModule } from '@modules/auth/auth.module';
import { RATING_ORDER_LOOKUP_KEY } from '@modules/ratings/application/ports/rating-order-lookup.port';
import { RATING_REPOSITORY_KEY } from '@modules/ratings/application/ports/rating-repository.port';
import { GetOrderRatingsUseCase } from '@modules/ratings/application/use-cases/get-order-ratings/get-order-ratings.use-case';
import { SubmitRatingUseCase } from '@modules/ratings/application/use-cases/submit-rating/submit-rating.use-case';
import { PrismaRatingRepository } from '@modules/ratings/infrastructure/repositories/prisma-rating.repository';
import { RatingsController } from '@modules/ratings/presentation/ratings.controller';
import { Module } from '@nestjs/common';

@Module({
	imports: [PrismaModule, AuthModule],
	controllers: [RatingsController],
	providers: [
		PrismaRatingRepository,
		{
			provide: RATING_REPOSITORY_KEY,
			useExisting: PrismaRatingRepository,
		},
		{
			provide: RATING_ORDER_LOOKUP_KEY,
			useExisting: PrismaRatingRepository,
		},
		SubmitRatingUseCase,
		GetOrderRatingsUseCase,
	],
})
export class RatingsModule {}
