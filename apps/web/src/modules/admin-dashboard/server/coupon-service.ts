import type { AuthenticatedApiRequest } from './admin-service';
import {
	type AdminCouponReportOutput,
	type AdminCouponSummaryOutput,
	adminCouponReportSchema,
	adminCouponSummarySchema,
	type CreateCouponPayload,
} from './coupon-contracts';

type ApiRequest = <T>(
	path: string,
	init: RequestInit & { auth: true },
) => Promise<T>;

export const getAdminCoupons = async (
	apiRequest: AuthenticatedApiRequest,
): Promise<AdminCouponSummaryOutput[]> => {
	const response = await apiRequest<unknown>('/admin/coupons', { auth: true });
	return adminCouponSummarySchema.array().parse(response);
};

export const getAdminCouponReport = async (
	couponId: string,
	apiRequest: AuthenticatedApiRequest,
): Promise<AdminCouponReportOutput> => {
	const response = await apiRequest<unknown>(
		`/admin/coupons/${encodeURIComponent(couponId)}/report`,
		{ auth: true },
	);
	return adminCouponReportSchema.parse(response);
};

export const createAdminCoupon = async (
	payload: CreateCouponPayload,
	apiRequest: ApiRequest,
): Promise<{ id: string; code: string }> => {
	return await apiRequest<{ id: string; code: string }>('/admin/coupons', {
		auth: true,
		method: 'POST',
		body: JSON.stringify(payload),
	});
};

export const disableAdminCoupon = async (
	couponId: string,
	apiRequest: ApiRequest,
): Promise<void> => {
	await apiRequest(`/admin/coupons/${encodeURIComponent(couponId)}/disable`, {
		auth: true,
		method: 'POST',
	});
};

export const enableAdminCoupon = async (
	couponId: string,
	apiRequest: ApiRequest,
): Promise<void> => {
	await apiRequest(`/admin/coupons/${encodeURIComponent(couponId)}/enable`, {
		auth: true,
		method: 'POST',
	});
};
