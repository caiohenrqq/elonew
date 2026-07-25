'use client';

import { CheckCircle2, X } from 'lucide-react';
import { useState } from 'react';
import { DashboardSubmitButton } from '@/shared/dashboard/dashboard-submit-button';
import { getButtonClassName } from '@/shared/ui/components/button';
import { Modal } from '@/shared/ui/components/modal';
import {
	acceptBoosterOrderAction,
	completeBoosterOrderAction,
} from '../actions/booster-actions';

export const AcceptBoosterOrderButton = ({ orderId }: { orderId: string }) => {
	const [isOpen, setIsOpen] = useState(false);
	const titleId = `accept-order-${orderId}`;

	return (
		<>
			<button
				type="button"
				onClick={() => setIsOpen(true)}
				className={getButtonClassName({ size: 'sm', className: 'gap-2' })}
			>
				<CheckCircle2 className="h-3 w-3" />
				Aceitar
			</button>
			{isOpen ? (
				<Modal labelledBy={titleId} onClose={() => setIsOpen(false)}>
					<div className="flex items-start justify-between gap-4">
						<div>
							<h2 id={titleId} className="text-sm font-black text-white">
								Aceitar pedido
							</h2>
							<p className="mt-1 text-xs text-white/50">
								Defina o prazo de entrega para iniciar o serviço.
							</p>
						</div>
						<button
							type="button"
							aria-label="Fechar"
							onClick={() => setIsOpen(false)}
							className={getButtonClassName({
								variant: 'ghost',
								size: 'icon',
							})}
						>
							<X className="h-4 w-4" />
						</button>
					</div>
					<form
						action={acceptBoosterOrderAction.bind(null, orderId)}
						className="mt-5 grid gap-4"
					>
						<label className="grid gap-2 text-xs text-white/65">
							Prazo
							<input
								type="date"
								name="deadline"
								required
								min={new Date().toISOString().slice(0, 10)}
								className="h-10 rounded-sm border border-white/10 bg-black/20 px-3 text-sm text-white focus:border-hextech-cyan focus:outline-none"
							/>
						</label>
						<div className="flex justify-end gap-2">
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
							<DashboardSubmitButton pendingLabel="Aceitando">
								Confirmar aceite
							</DashboardSubmitButton>
						</div>
					</form>
				</Modal>
			) : null}
		</>
	);
};

export const CompleteBoosterOrderButton = ({
	orderId,
	label = 'Finalizar',
}: {
	orderId: string;
	label?: string;
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const titleId = `complete-order-${orderId}`;

	return (
		<>
			<button
				type="button"
				onClick={() => setIsOpen(true)}
				className={getButtonClassName({
					variant: 'outline',
					size: 'sm',
					className: 'gap-2',
				})}
			>
				<CheckCircle2 className="h-3 w-3" />
				{label}
			</button>
			{isOpen ? (
				<Modal labelledBy={titleId} onClose={() => setIsOpen(false)}>
					<h2 id={titleId} className="text-sm font-black text-white">
						Finalizar pedido?
					</h2>
					<p className="mt-2 text-xs leading-relaxed text-white/55">
						Esta ação encerra o serviço e libera o processo de repasse.
					</p>
					<form
						action={completeBoosterOrderAction.bind(null, orderId)}
						className="mt-5 flex justify-end gap-2"
					>
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
						<DashboardSubmitButton pendingLabel="Finalizando">
							Confirmar finalização
						</DashboardSubmitButton>
					</form>
				</Modal>
			) : null}
		</>
	);
};
