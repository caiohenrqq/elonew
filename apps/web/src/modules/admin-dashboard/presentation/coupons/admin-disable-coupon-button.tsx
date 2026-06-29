'use client';

import { useActionState } from 'react';
import { getButtonClassName } from '@/shared/ui/components/button';
import { cn } from '@/shared/ui/utils/cn';
import {
	type CouponActionState,
	disableAdminCouponAction,
	enableAdminCouponAction,
} from '../../actions/coupon-actions';

const CouponStatusButton = ({
	couponId,
	action,
	label,
	pendingLabel,
	className,
}: {
	couponId: string;
	action: typeof disableAdminCouponAction;
	label: string;
	pendingLabel: string;
	className: string;
}) => {
	const [state, formAction, pending] = useActionState<
		CouponActionState,
		FormData
	>(action, {});

	return (
		<form action={formAction} className="flex flex-col items-end gap-1">
			<input type="hidden" name="couponId" value={couponId} />
			<button
				type="submit"
				disabled={pending}
				className={cn(
					getButtonClassName({ variant: 'outline', size: 'sm' }),
					className,
				)}
			>
				{pending ? pendingLabel : label}
			</button>

			{state.error ? (
				<span className="text-[10px] font-medium text-red-300">
					{state.error}
				</span>
			) : null}
		</form>
	);
};

export const AdminDisableCouponButton = ({
	couponId,
}: {
	couponId: string;
}) => (
	<CouponStatusButton
		couponId={couponId}
		action={disableAdminCouponAction}
		label="Desativar"
		pendingLabel="Desativando"
		className="border-red-500/30 text-red-300 hover:border-red-500 hover:bg-red-500 hover:text-white"
	/>
);

export const AdminEnableCouponButton = ({ couponId }: { couponId: string }) => (
	<CouponStatusButton
		couponId={couponId}
		action={enableAdminCouponAction}
		label="Ativar"
		pendingLabel="Ativando"
		className="border-emerald-500/30 text-emerald-300 hover:border-emerald-500 hover:bg-emerald-500 hover:text-white"
	/>
);
