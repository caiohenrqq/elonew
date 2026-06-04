'use client';

import { Clock3, FileText, Send } from 'lucide-react';
import { useActionState } from 'react';
import { DashboardSubmitButton } from '@/shared/dashboard/dashboard-submit-button';
import { formatOrderRoute, formatServiceType } from '@/shared/format/orders';
import { fieldSurface } from '@/shared/ui/styles/classes';
import { cn } from '@/shared/ui/utils/cn';
import type { CreateSupportTicketActionState } from '../../actions/order-actions';
import type { ClientDashboardOrder } from '../../model/orders';

type SupportTicketPanelProps = {
	action: (
		state: CreateSupportTicketActionState,
		formData: FormData,
	) => Promise<CreateSupportTicketActionState>;
	orders: ClientDashboardOrder[];
};

export const SupportTicketPanel = ({
	action,
	orders,
}: SupportTicketPanelProps) => {
	const [state, formAction] = useActionState(action, {});

	return (
		<section className="dashboard-animate grid w-full overflow-hidden rounded-sm border border-white/10 bg-[#0b0b0d] lg:grid-cols-[minmax(0,1fr)_340px]">
			<div className="p-5 sm:p-7">
				<form action={formAction} className="grid gap-5">
					<label className="grid gap-2">
						<span className="text-[10px] font-black uppercase tracking-widest text-white/45">
							Pedido relacionado
						</span>
						<select
							name="orderId"
							className={cn(fieldSurface, 'h-12 bg-white/[0.03] text-sm')}
							defaultValue=""
						>
							<option value="">Ticket geral</option>
							{orders.map((order) => (
								<option key={order.id} value={order.id}>
									{formatOrderOption(order)}
								</option>
							))}
						</select>
						<p className="text-[10px] leading-relaxed text-white/35">
							{orders.length > 0
								? 'Vincule um pedido quando o assunto for sobre um serviço específico.'
								: 'Você ainda não tem pedidos para vincular.'}
						</p>
					</label>

					<div className="grid items-start gap-5 lg:grid-cols-[0.8fr_1.2fr]">
						<label className="grid gap-2">
							<span className="text-[10px] font-black uppercase tracking-widest text-white/45">
								Assunto
							</span>
							<input
								name="subject"
								className={cn(fieldSurface, 'h-12 text-sm')}
								placeholder="Ex.: Pagamento não confirmado"
								required
								minLength={3}
								maxLength={160}
							/>
						</label>

						<label className="grid gap-2">
							<span className="text-[10px] font-black uppercase tracking-widest text-white/45">
								Mensagem
							</span>
							<textarea
								name="content"
								className={cn(
									fieldSurface,
									'h-36 min-h-36 resize-none text-sm leading-relaxed',
								)}
								placeholder="Descreva o que precisa resolver."
								required
								maxLength={5000}
							/>
						</label>
					</div>

					<div className="flex flex-col gap-3 border-white/10 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
						<p
							className={cn(
								'min-h-4 text-xs font-medium',
								state.error ? 'text-red-300' : 'text-emerald-300',
							)}
						>
							{state.error ?? state.success ?? ''}
						</p>

						<DashboardSubmitButton
							className="h-10 w-full sm:w-auto"
							pendingLabel="Enviando"
						>
							<Send className="h-3 w-3" />
							Criar ticket
						</DashboardSubmitButton>
					</div>
				</form>
			</div>

			<aside className="border-white/10 border-t bg-white/[0.02] p-5 sm:p-7 lg:border-t-0 lg:border-l">
				<div className="space-y-5">
					<div>
						<p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40">
							Atendimento
						</p>
						<p className="mt-2 text-sm font-bold text-white">
							Seu histórico fica salvo em Tickets.
						</p>
					</div>

					<div className="grid gap-3">
						<div className="rounded-sm border border-white/10 bg-black/20 p-4">
							<div className="flex items-center gap-3">
								<Clock3 className="h-4 w-4 text-hextech-cyan" />
								<div>
									<p className="text-[10px] font-black uppercase tracking-widest text-white/35">
										Resposta
									</p>
									<p className="mt-1 text-sm font-bold text-white">
										Por ordem de chegada
									</p>
								</div>
							</div>
						</div>

						<div className="rounded-sm border border-white/10 bg-black/20 p-4">
							<div className="flex items-center gap-3">
								<FileText className="h-4 w-4 text-hextech-cyan" />
								<div>
									<p className="text-[10px] font-black uppercase tracking-widest text-white/35">
										Pedidos
									</p>
									<p className="mt-1 text-sm font-bold text-white">
										{orders.length.toString().padStart(2, '0')} disponíveis
									</p>
								</div>
							</div>
						</div>
					</div>

					<div className="rounded-sm border border-white/10 bg-black/20 p-4">
						<p className="text-[10px] font-black uppercase tracking-widest text-white/35">
							Canais
						</p>
						<p className="mt-2 text-xs leading-relaxed text-white/50">
							Tickets gerais também são aceitos quando o assunto não estiver
							ligado a um pedido.
						</p>
					</div>
				</div>
			</aside>
		</section>
	);
};

const formatOrderOption = (order: ClientDashboardOrder) => {
	const service = formatServiceType(order.serviceType);
	const route = formatOrderRoute(order);

	return `${order.id.slice(0, 8)} - ${service} - ${route}`;
};
