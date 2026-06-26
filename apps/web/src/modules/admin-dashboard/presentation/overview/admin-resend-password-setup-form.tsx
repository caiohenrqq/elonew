'use client';

import { MailPlus } from 'lucide-react';
import { useActionState } from 'react';
import { getButtonClassName } from '@/shared/ui/components/button';
import {
	type AdminGovernanceActionState,
	resendAdminUserPasswordSetupAction,
} from '../../actions/admin-actions';

export const AdminResendPasswordSetupForm = ({
	userId,
}: {
	userId: string;
}) => {
	const [state, formAction, pending] = useActionState<
		AdminGovernanceActionState,
		FormData
	>(resendAdminUserPasswordSetupAction, {});

	return (
		<form action={formAction} className="grid justify-items-end gap-1">
			<input type="hidden" name="targetId" value={userId} />
			<button
				type="submit"
				disabled={pending}
				className={getButtonClassName({
					variant: 'outline',
					size: 'sm',
					className: 'ml-auto w-fit gap-2',
				})}
			>
				<MailPlus className="h-3.5 w-3.5" />
				{pending ? 'Reenviando' : 'Reenviar acesso'}
			</button>
			<p className="min-h-4 text-right text-[10px] text-white/35">
				{state.error ?? (state.success ? 'E-mail enviado.' : '')}
			</p>
		</form>
	);
};
