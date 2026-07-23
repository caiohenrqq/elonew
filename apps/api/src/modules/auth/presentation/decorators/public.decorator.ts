import { SetMetadata } from '@nestjs/common';

// Marks a route as requiring no user session. JwtAuthGuard runs globally, so
// this is the only way a route can be reached without a bearer token.
export const IS_PUBLIC_KEY = 'isPublic';

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
