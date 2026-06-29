'use client';

import { TicketPercent, X } from 'lucide-react';
import { useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { getButtonClassName } from '@/shared/ui/components/button';
import { AdminCreateCouponForm } from './admin-create-coupon-form';

export const AdminCreateCouponDialog = () => {
	const [isOpen, setIsOpen] = useState(false);
	const titleId = useId();

	return (
		<>
			<button
				type="button"
				onClick={() => setIsOpen(true)}
				className={getButtonClassName({
					size: 'md',
					variant: 'secondary',
					className: 'gap-2',
				})}
			>
				<TicketPercent className="h-4 w-4" />
				Criar cupom
			</button>

			{isOpen && typeof document !== 'undefined'
				? createPortal(
						<div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/70 px-4 py-10 backdrop-blur-sm">
							<button
								type="button"
								aria-label="Fechar modal"
								className="fixed inset-0 cursor-default"
								onClick={() => setIsOpen(false)}
							/>
							<div
								role="dialog"
								aria-modal="true"
								aria-labelledby={titleId}
								className="relative w-full max-w-5xl rounded-sm border border-white/10 bg-background p-5 shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
							>
								<div className="mb-5 flex items-start justify-between gap-4">
									<div className="space-y-1">
										<h2
											id={titleId}
											className="text-sm font-black uppercase tracking-[0.22em] text-white"
										>
											Novo cupom
										</h2>
										<p className="text-xs text-white/45">
											Defina o desconto e as regras de elegibilidade.
										</p>
									</div>
									<button
										type="button"
										aria-label="Fechar"
										onClick={() => setIsOpen(false)}
										className={getButtonClassName({
											size: 'icon',
											variant: 'ghost',
										})}
									>
										<X className="h-4 w-4" />
									</button>
								</div>
								<AdminCreateCouponForm onSuccess={() => setIsOpen(false)} />
							</div>
						</div>,
						document.body,
					)
				: null}
		</>
	);
};
