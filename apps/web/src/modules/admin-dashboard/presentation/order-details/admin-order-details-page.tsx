import { ArrowLeft, FileText, ShieldCheck, Users } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getExtraLabel } from '@/modules/client-dashboard/model/new-order-options';
import type { ChatMessage } from '@/shared/chat/chat.types';
import { ChatPanel } from '@/shared/chat/chat-panel';
import { DefinitionItem } from '@/shared/dashboard/definition-item';
import { formatCurrency } from '@/shared/format/currency';
import { formatDateTime } from '@/shared/format/date';
import {
	formatGovernanceAction,
	formatServiceType,
} from '@/shared/format/orders';
import { OrderRankRoute } from '@/shared/orders/order-rank-route';
import { getOrderRatings } from '@/shared/ratings/rating-actions';
import { RatingStars } from '@/shared/ratings/rating-card';
import type { RatingOutput } from '@/shared/ratings/rating-contracts';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '@/shared/ui/components/card';
import { OrderStatusBadge } from '@/shared/ui/components/status-badge';
import {
	forceCancelAdminOrderAction,
	getAdminOrder,
	getAdminOrderChatMessages,
	getAdminUserId,
	releaseAdminOrderBoosterPaymentAction,
} from '../../actions/admin-actions';
import type { AdminOrderOutput } from '../../server/admin-contracts';
import { AdminGovernanceForm } from '../overview/admin-governance-form';

type AdminOrderDetailsPageProps = {
	orderId: string;
};

type AdminOrderDetailsViewProps = {
	currentUserId: string;
	messages: ChatMessage[];
	order: AdminOrderOutput;
	ratings: RatingOutput[];
};

export const AdminOrderDetailsView = ({
	currentUserId,
	messages,
	order,
	ratings,
}: AdminOrderDetailsViewProps) => {
	const isForceCancelDisabled = order.status === 'cancelled';
	const { boosterPayment } = order;
	const releaseDisabledReason = !boosterPayment
		? 'Nenhum crédito de conclusão registrado para este pedido.'
		: boosterPayment.releasedAt
			? `Pagamento já liberado em ${formatDateTime(boosterPayment.releasedAt)}.`
			: order.status !== 'completed'
				? 'O pagamento só pode ser liberado em pedidos concluídos.'
				: undefined;

	return (
		<div className="space-y-8">
			<Link
				href="/admin/orders"
				className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 transition-colors hover:text-white"
			>
				<ArrowLeft className="h-3 w-3" />
				Voltar aos pedidos
			</Link>

			<header className="rounded-sm border border-white/10 bg-white/[0.025] p-6">
				<div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
					<div className="min-w-0 space-y-2">
						<div className="flex flex-wrap items-center gap-3">
							<h1 className="truncate text-2xl font-black uppercase tracking-tight text-white">
								{formatServiceType(order.serviceType)}
							</h1>
							<OrderStatusBadge status={order.status} />
						</div>
						<p className="break-all font-mono text-[10px] text-white/35">
							{order.id}
						</p>
					</div>
					<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:min-w-105">
						<DefinitionItem
							label="Valor"
							value={formatCurrency(order.totalAmount)}
							valueClassName="text-hextech-cyan"
						/>
						<DefinitionItem
							label="Criado em"
							value={formatDateTime(order.createdAt)}
						/>
						<DefinitionItem
							label="Mensagens"
							value={messages.length.toString().padStart(2, '0')}
						/>
					</div>
				</div>
			</header>

			<div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_420px]">
				<div className="space-y-8">
					<Card className="border-hextech-gold/15">
						<CardHeader>
							<CardTitle>Avaliações</CardTitle>
						</CardHeader>
						<CardContent className="space-y-5">
							{ratings.length ? (
								ratings.map((rating) => (
									<div key={rating.id} className="space-y-2">
										<p className="text-[10px] font-black uppercase tracking-widest text-white/40">
											{rating.fromUserId === order.clientId
												? 'Cliente → Booster'
												: 'Booster → Cliente'}
										</p>
										<RatingStars score={rating.score} />
										{rating.comment ? (
											<p className="text-sm leading-relaxed text-white/70">
												{rating.comment}
											</p>
										) : null}
										<p className="text-[10px] text-white/30">
											{formatDateTime(rating.createdAt)}
										</p>
									</div>
								))
							) : (
								<p className="text-xs text-white/35">
									Nenhuma avaliação registrada.
								</p>
							)}
						</CardContent>
					</Card>

					<Card className="border-white/10">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<FileText className="h-4 w-4 text-hextech-cyan" />
								Dados do pedido
							</CardTitle>
						</CardHeader>
						<CardContent className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
							<div className="space-y-1">
								<p className="text-[10px] text-white/40 uppercase tracking-widest">
									Status
								</p>
								<OrderStatusBadge status={order.status} />
							</div>
							<DefinitionItem
								label="Total"
								value={formatCurrency(order.totalAmount)}
								valueClassName="text-hextech-cyan"
							/>
							<DefinitionItem
								label="Serviço"
								value={formatServiceType(order.serviceType)}
							/>
							<DefinitionItem
								label="Criado em"
								value={formatDateTime(order.createdAt)}
							/>
							<div className="sm:col-span-2 lg:col-span-4">
								<p className="mb-2 text-[10px] text-white/40 uppercase tracking-widest">
									Rota
								</p>
								<OrderRankRoute
									currentLeague={order.currentLeague ?? null}
									currentDivision={order.currentDivision ?? null}
									desiredLeague={order.desiredLeague ?? null}
									desiredDivision={order.desiredDivision ?? null}
									size="md"
								/>
							</div>
							<DefinitionItem
								label="Invocador"
								value={order.summonerName ?? 'Não informado'}
							/>
							<DefinitionItem
								label="Servidor"
								value={order.server ?? 'Não informado'}
							/>
							<DefinitionItem
								label="Fila"
								value={order.desiredQueue ?? 'Não informada'}
							/>
							<DefinitionItem
								label="PDL"
								value={`${order.currentLp ?? '—'} · ganho ${order.lpGain ?? '—'}`}
							/>
							<DefinitionItem
								label="Subtotal"
								value={formatCurrency(order.subtotal ?? null)}
							/>
							<DefinitionItem
								label="Desconto"
								value={formatCurrency(order.discountAmount ?? 0)}
							/>
							<div className="sm:col-span-2">
								<p className="text-[10px] text-white/40 uppercase tracking-widest">
									Extras
								</p>
								<p className="mt-1 text-xs leading-relaxed text-white/65">
									{order.extras?.length
										? order.extras
												.map(
													(extra) =>
														`${getExtraLabel(extra.type)} (${formatCurrency(extra.price)})`,
												)
												.join(', ')
										: 'Nenhum extra'}
								</p>
							</div>
						</CardContent>
					</Card>

					<Card className="border-white/10">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Users className="h-4 w-4 text-hextech-cyan" />
								Partes envolvidas
							</CardTitle>
						</CardHeader>
						<CardContent className="grid gap-6 md:grid-cols-2">
							<DefinitionItem
								label="Cliente"
								value={
									order.client?.username ?? order.clientId ?? 'Não informado'
								}
							/>
							<DefinitionItem
								label="Booster"
								value={
									order.booster?.username ?? order.boosterId ?? 'Não informado'
								}
							/>
						</CardContent>
					</Card>

					<Card className="border-white/10">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<ShieldCheck className="h-4 w-4 text-red-300" />
								Admin
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-2 border-b border-white/5 pb-4">
								<p className="text-[10px] font-black uppercase tracking-widest text-white/40">
									Pagamento do booster
								</p>
								{boosterPayment ? (
									<>
										<p className="text-sm font-black text-white">
											{formatCurrency(boosterPayment.amount)}
										</p>
										<p className="text-xs text-white/45">
											{boosterPayment.releasedAt
												? `Liberado em ${formatDateTime(boosterPayment.releasedAt)}${
														boosterPayment.releasedBy === 'admin'
															? ' por ação administrativa'
															: ''
													}`
												: `Bloqueado até ${formatDateTime(boosterPayment.availableAt)}`}
										</p>
									</>
								) : (
									<p className="text-xs text-white/35">
										Nenhum crédito de conclusão registrado.
									</p>
								)}
							</div>

							<AdminGovernanceForm
								action={releaseAdminOrderBoosterPaymentAction}
								targetId={order.id}
								label="Liberar pagamento do booster"
								placeholder="Motivo obrigatório da liberação antecipada"
								disabled={Boolean(releaseDisabledReason)}
								disabledReason={releaseDisabledReason}
							/>

							<AdminGovernanceForm
								action={forceCancelAdminOrderAction}
								targetId={order.id}
								label="Cancelar pedido"
								placeholder="Motivo obrigatório do cancelamento"
								disabled={isForceCancelDisabled}
								disabledReason={
									isForceCancelDisabled
										? 'Pedido já cancelado. Nenhuma nova ação é necessária.'
										: undefined
								}
								tone="danger"
							/>
							{order.latestGovernanceAction ? (
								<p className="text-xs text-white/45">
									{formatGovernanceAction(order.latestGovernanceAction.type)} /{' '}
									{order.latestGovernanceAction.reason}
								</p>
							) : (
								<p className="text-xs text-white/35">
									Nenhuma ação administrativa registrada.
								</p>
							)}
						</CardContent>
					</Card>
				</div>

				<div className="space-y-8">
					<ChatPanel
						messages={messages}
						currentUserId={currentUserId}
						isReadOnly
						title="Chat do pedido"
						statusText="Admin leitura"
						emptyTitle="Sem mensagens"
						emptyDescription="Nenhuma conversa foi registrada para este pedido."
						className="h-140 max-w-none border-white/10"
					/>
				</div>
			</div>
		</div>
	);
};

export const AdminOrderDetailsPage = async ({
	orderId,
}: AdminOrderDetailsPageProps) => {
	const order = await getAdminOrder(orderId);
	if (!order) notFound();

	const [chat, currentUserId, ratings] = await Promise.all([
		getAdminOrderChatMessages(orderId),
		getAdminUserId(),
		getOrderRatings(orderId),
	]);

	return (
		<AdminOrderDetailsView
			order={order}
			messages={chat.items}
			currentUserId={currentUserId}
			ratings={ratings}
		/>
	);
};
