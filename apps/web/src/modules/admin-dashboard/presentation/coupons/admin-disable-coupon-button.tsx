'use client';

import { useActionState } from 'react';
import { getButtonClassName } from '@/shared/ui/components/button';
import {
	type CouponActionState,
	disableAdminCouponAction,
} from '../../actions/coupon-actions';

export const AdminDisableCouponButton = ({
	couponId,
}: {
	couponId: string;
}) => {
	const [state, formAction, pending] = useActionState<
		CouponActionState,
		FormData
	>(disableAdminCouponAction, {});

	return (
		<form action={formAction} className="flex flex-col items-end gap-1">
			<input type="hidden" name="couponId" value={couponId} />
			<button
				type="submit"
				disabled={pending}
				className={getButtonClassName({ variant: 'danger', size: 'sm' })}
			>
				{pending ? 'Desativando' : 'Desativar'}
			</button>
			{state.error ? (
				<span className="text-[10px] font-medium text-red-300">
					{state.error}
				</span>
			) : null}
		</form>
	);
};
