import { Public } from '@modules/auth/presentation/decorators/public.decorator';
import { InternalApiKeyGuard } from '@modules/auth/presentation/guards/internal-api-key.guard';
import { applyDecorators, UseGuards } from '@nestjs/common';

// Worker-to-API routes carry no user session, so they must opt out of the
// global JwtAuthGuard. Bundling the opt-out with the API key guard makes it
// impossible to expose an internal route by applying only one of the two.
export const InternalApi = () =>
	applyDecorators(Public(), UseGuards(InternalApiKeyGuard));
