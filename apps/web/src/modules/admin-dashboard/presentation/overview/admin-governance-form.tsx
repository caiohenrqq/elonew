'use client';

import { getButtonClassName } from '@packages/ui/components/button';
import { fieldSurface } from '@packages/ui/styles/classes';
import { cn } from '@packages/ui/utils/cn';
import { useActionState } from 'react';
import type { AdminGovernanceActionState } from '../../actions/admin-actions';

type AdminGovernanceFormProps = {
	action: (
		state: AdminGovernanceActionState,
		formData: FormData,
	) => Promise<AdminGovernanceActionState>;
	targetId: string;
	label: string;
	placeholder: string;
	tone?: 'danger' | 'neutral';
};

export const AdminGovernanceForm = ({
	action,
	targetId,
	label,
	placeholder,
	tone = 'neutral',
}: AdminGovernanceFormProps) => {
	const [state, formAction, pending] = useActionState(action, {});
	const fieldId = `${targetId}-${label.toLowerCase().replace(/\s+/g, '-')}`;

	return (
		<details className="group/action w-full">
			<summary
				className={cn(
					getButtonClassName({
						variant: tone === 'danger' ? 'danger' : 'outline',
						size: 'sm',
						className: 'ml-auto w-fit list-none gap-2',
					}),
					'[&::-webkit-details-marker]:hidden',
				)}
			>
				{label}
			</summary>
			<form
				action={formAction}
				className="mt-3 grid w-full gap-2 rounded-sm border border-white/5 bg-black/20 p-3"
			>
				<input type="hidden" name="targetId" value={targetId} />
				<label className="sr-only" htmlFor={fieldId}>
					Motivo
				</label>
				<textarea
					id={fieldId}
					name="reason"
					placeholder={placeholder}
					className={cn(
						fieldSurface,
						'h-20 min-h-20 resize-none bg-black/20 leading-relaxed placeholder:text-white/30',
					)}
					required
				/>
				<div className="flex items-center justify-between gap-3">
					<p className="min-h-4 text-[10px] font-medium text-red-300">
						{state.error ?? ''}
					</p>
					<button
						type="submit"
						disabled={pending}
						className={getButtonClassName({
							variant: tone === 'danger' ? 'danger' : 'secondary',
							size: 'sm',
							className: 'min-w-28',
						})}
					>
						{pending ? 'Salvando' : label}
					</button>
				</div>
			</form>
		</details>
	);
};
