import { AppSettingsModule } from '@app/common/settings/app-settings.module';
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
	imports: [AppSettingsModule],
	providers: [PrismaService],
	exports: [PrismaService],
})
export class PrismaModule {}
