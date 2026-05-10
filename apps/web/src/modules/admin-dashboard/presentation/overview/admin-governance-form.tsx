'use client';

import { getButtonClassName } from '@packages/ui/components/button';
import { fieldSurface } from '@packages/ui/styles/classes';
import { cn } from '@packages/ui/utils/cn';
import { useActionState, useEffect, useId, useState } from 'react';
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
	const [isOpen, setIsOpen] = useState(false);
	const titleId = useId();
	const fieldId = `${targetId}-${label.toLowerCase().replace(/\s+/g, '-')}`;

	useEffect(() => {
		if (state.success) setIsOpen(false);
	}, [state.success]);

	return (
		<>
			<button
				type="button"
				onClick={() => setIsOpen(true)}
				className={getButtonClassName({
					variant: tone === 'danger' ? 'danger' : 'outline',
					size: 'sm',
					className: 'ml-auto w-fit gap-2',
				})}
			>
				{label}
			</button>

			{isOpen ? (
				<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
					<button
						type="button"
						aria-label="Fechar modal"
						className="absolute inset-0 cursor-default"
						onClick={() => setIsOpen(false)}
					/>
					<div
						role="dialog"
						aria-modal="true"
						aria-labelledby={titleId}
						className="relative w-full max-w-md rounded-sm border border-white/10 bg-background p-5 shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
					>
						<div className="mb-4 space-y-1">
							<h2
								id={titleId}
								className="text-xs font-black uppercase tracking-[0.22em] text-white"
							>
								{label}
							</h2>
							<p className="text-xs leading-relaxed text-white/45">
								Informe o motivo para registrar esta ação administrativa.
							</p>
						</div>
						<form action={formAction} className="grid w-full gap-3">
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
									'h-28 min-h-28 resize-none bg-black/20 leading-relaxed placeholder:text-white/30',
								)}
								required
							/>
							<p className="min-h-4 text-[10px] font-medium text-red-300">
								{state.error ?? ''}
							</p>
							<div className="flex items-center justify-end gap-3">
								<button
									type="button"
									onClick={() => setIsOpen(false)}
									className={getButtonClassName({
										variant: 'outline',
										size: 'sm',
									})}
								>
									Cancelar
								</button>
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
					</div>
				</div>
			) : null}
		</>
	);
};
