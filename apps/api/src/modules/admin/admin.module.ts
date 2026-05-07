import { PrismaModule } from '@app/common/prisma/prisma.module';
import { ADMIN_DASHBOARD_READER_KEY } from '@modules/admin/application/ports/admin-dashboard-reader.port';
import { ADMIN_GOVERNANCE_REPOSITORY_KEY } from '@modules/admin/application/ports/admin-governance.repository';
import { BlockAdminUserUseCase } from '@modules/admin/application/use-cases/block-admin-user/block-admin-user.use-case';
import { ForceCancelAdminOrderUseCase } from '@modules/admin/application/use-cases/force-cancel-admin-order/force-cancel-admin-order.use-case';
import { GetAdminDashboardUseCase } from '@modules/admin/application/use-cases/get-admin-dashboard/get-admin-dashboard.use-case';
import { UnblockAdminUserUseCase } from '@modules/admin/application/use-cases/unblock-admin-user/unblock-admin-user.use-case';
import { PrismaAdminDashboardReader } from '@modules/admin/infrastructure/repositories/prisma-admin-dashboard.reader';
import { PrismaAdminGovernanceRepository } from '@modules/admin/infrastructure/repositories/prisma-admin-governance.repository';
import { AdminController } from '@modules/admin/presentation/admin.controller';
import { AuthModule } from '@modules/auth/auth.module';
import { OrdersModule } from '@modules/orders/orders.module';
import { UsersModule } from '@modules/users/users.module';
import { Module } from '@nestjs/common';

@Module({
	imports: [PrismaModule, AuthModule, OrdersModule, UsersModule],
	controllers: [AdminController],
	providers: [
		PrismaAdminDashboardReader,
		PrismaAdminGovernanceRepository,
		{
			provide: ADMIN_DASHBOARD_READER_KEY,
			useFactory: (
				reader: PrismaAdminDashboardReader,
			): PrismaAdminDashboardReader => reader,
			inject: [PrismaAdminDashboardReader],
		},
		{
			provide: ADMIN_GOVERNANCE_REPOSITORY_KEY,
			useFactory: (
				repository: PrismaAdminGovernanceRepository,
			): PrismaAdminGovernanceRepository => repository,
			inject: [PrismaAdminGovernanceRepository],
		},
		GetAdminDashboardUseCase,
		BlockAdminUserUseCase,
		UnblockAdminUserUseCase,
		ForceCancelAdminOrderUseCase,
	],
})
export class AdminModule {}
