'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { api } from '@/shared/api-client-management/api-client';
import { getAuthErrorMessage } from '@/shared/api-client-management/user-messages';
import { redirectOnAuthError } from '@/shared/auth/redirect-on-auth-error';
import type { AuthSession } from '@/shared/auth/session';
import { getAuthSession } from '@/shared/auth/session';
import { assertSameOriginRequest } from '@/shared/security/origin';
import type {
	AdminCouponReportOutput,
	AdminCouponSummaryOutput,
	CreateCouponPayload,
} from '../server/coupon-contracts';
import {
	createAdminCoupon,
	disableAdminCoupon,
	enableAdminCoupon,
	getAdminCouponReport as getAdminCouponReportFromApi,
	getAdminCoupons as getAdminCouponsFromApi,
} from '../server/coupon-service';

export type CouponActionState = {
	error?: string;
	success?: boolean;
};

const getAdminSessionOrRedirect = async () => {
	const session = await getAuthSession();
	if (!session || session.userRole !== 'ADMIN' || !session.userId)
		redirect('/login');
	return session as AuthSession & { userId: string };
};

const renderReadApiRequest = <T>(
	path: string,
	init: RequestInit & { auth: true },
) => api.request<T>(path, { ...init, allowSessionRefresh: false });

const optionalString = (
	value: FormDataEntryValue | null,
): string | undefined => {
	const text = String(value ?? '').trim();
	return text.length > 0 ? text : undefined;
};

const optionalInt = (value: FormDataEntryValue | null): number | undefined => {
	const text = String(value ?? '').trim();
	if (text.length === 0) return undefined;
	const parsed = Number.parseInt(text, 10);
	return Number.isFinite(parsed) ? parsed : undefined;
};

// ponytail: discount is stored/applied in reais (Money.fromDecimal); subtotals
// are cents. Internally consistent — convert discount to cents only if it ever
// causes a real bug.
const optionalReaisToCents = (
	value: FormDataEntryValue | null,
): number | undefined => {
	const text = String(value ?? '')
		.trim()
		.replace(',', '.');
	if (text.length === 0) return undefined;
	const parsed = Number.parseFloat(text);
	if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
	return Math.round(parsed * 100);
};

const getAllStrings = (formData: FormData, name: string): string[] =>
	formData.getAll(name).map((entry) => String(entry));

const optionalRank = (
	league: FormDataEntryValue | null,
	division: FormDataEntryValue | null,
): { league: string; division: string } | undefined => {
	const leagueText = optionalString(league);
	const divisionText = optionalString(division);
	if (!leagueText || !divisionText) return undefined;
	return { league: leagueText, division: divisionText };
};

const parseCreateCouponForm = (formData: FormData): CreateCouponPayload => {
	const discountType =
		formData.get('discountType') === 'fixed' ? 'fixed' : 'percentage';
	return {
		code: optionalString(formData.get('code')),
		discountType,
		discount: Number(formData.get('discount') ?? 0),
		firstOrderOnly: formData.get('firstOrderOnly') === 'on',
		allowedServiceTypes: getAllStrings(formData, 'allowedServiceTypes'),
		allowedQueues: getAllStrings(formData, 'allowedQueues'),
		allowedEmails: getAllStrings(formData, 'allowedEmails'),
		minSubtotal: optionalReaisToCents(formData.get('minSubtotal')),
		maxSubtotal: optionalReaisToCents(formData.get('maxSubtotal')),
		minRank: optionalRank(
			formData.get('minRankLeague'),
			formData.get('minRankDivision'),
		),
		maxRank: optionalRank(
			formData.get('maxRankLeague'),
			formData.get('maxRankDivision'),
		),
		minExtrasCount: optionalInt(formData.get('minExtrasCount')),
		requiredExtra: optionalString(formData.get('requiredExtra')),
		globalUsageLimit: optionalInt(formData.get('globalUsageLimit')),
		perUserUsageLimit: optionalInt(formData.get('perUserUsageLimit')),
	};
};

export const getAdminCoupons = async (): Promise<
	AdminCouponSummaryOutput[]
> => {
	await getAdminSessionOrRedirect();
	try {
		return await getAdminCouponsFromApi(renderReadApiRequest);
	} catch (error) {
		return redirectOnAuthError(error);
	}
};

export const getCouponReportAction = async (
	couponId: string,
): Promise<AdminCouponReportOutput | null> => {
	await getAdminSessionOrRedirect();
	try {
		return await getAdminCouponReportFromApi(couponId, renderReadApiRequest);
	} catch {
		return null;
	}
};

export const createAdminCouponAction = async (
	_state: CouponActionState,
	formData: FormData,
): Promise<CouponActionState> => {
	try {
		await assertSameOriginRequest();
		await getAdminSessionOrRedirect();
		await createAdminCoupon(parseCreateCouponForm(formData), api.request);
		revalidatePath('/admin/coupons');
		return { success: true };
	} catch (error) {
		return { error: getAuthErrorMessage(error) };
	}
};

export const disableAdminCouponAction = async (
	_state: CouponActionState,
	formData: FormData,
): Promise<CouponActionState> => {
	try {
		await assertSameOriginRequest();
		await getAdminSessionOrRedirect();
		const couponId = String(formData.get('couponId') ?? '').trim();
		if (!couponId) return { error: 'Cupom inválido.' };
		await disableAdminCoupon(couponId, api.request);
		revalidatePath('/admin/coupons');
		return { success: true };
	} catch (error) {
		return { error: getAuthErrorMessage(error) };
	}
};

export const enableAdminCouponAction = async (
	_state: CouponActionState,
	formData: FormData,
): Promise<CouponActionState> => {
	try {
		await assertSameOriginRequest();
		await getAdminSessionOrRedirect();
		const couponId = String(formData.get('couponId') ?? '').trim();
		if (!couponId) return { error: 'Cupom inválido.' };
		await enableAdminCoupon(couponId, api.request);
		revalidatePath('/admin/coupons');
		return { success: true };
	} catch (error) {
		return { error: getAuthErrorMessage(error) };
	}
};
