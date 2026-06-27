import { z } from 'zod';

export {
	type CreateCouponInput as CreateCouponSchemaInput,
	createCouponSchema,
} from '@packages/shared/coupons/create-coupon.schema';

export const couponIdParamSchema = z.string().trim().min(1);
export type CouponIdParamSchemaInput = z.infer<typeof couponIdParamSchema>;
