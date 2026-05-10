import { Badge } from '@packages/ui/components/badge';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '@packages/ui/components/card';
import { ArrowLeft, FileText, ShieldCheck, Users } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ChatMessage } from '@/shared/chat/chat.types';
import { ChatPanel } from '@/shared/chat/chat-panel';
import { DefinitionItem } from '@/shared/dashboard/definition-item';
import {
	forceCancelAdminOrderAction,
	getAdminOrderChatMessages,
	getAdminOrders,
	getAdminUserId,
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
};

const formatCurrency = (value: number | null) => {
	if (value === null) return 'Não informado';

	return new Intl.NumberFormat('pt-BR', {
		style: 'currency',
		currency: 'BRL',
	}).format(value);
};

const formatDate = (value: string | null) =>
	value
		? new Intl.DateTimeFormat('pt-BR', {
				dateStyle: 'short',
				timeStyle: 'short',
			}).format(new Date(value))
		: 'Não informado';

const formatTitleCase = (value: string) =>
	value
		.split(/[_\s-]+/)
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ');

const formatServiceType = (serviceType: string | null) => {
	if (!serviceType) return 'Serviço indisponível';

	return formatTitleCase(serviceType);
};

const formatOrderStatus = (status: string) => {
	const labels: Record<string, string> = {
		accepted: 'Aceito',
		awaiting_payment: 'Aguardando pagamento',
		cancelled: 'Cancelado',
		completed: 'Finalizado',
		in_progress: 'Em execução',
		paid: 'Pago',
		pending_booster: 'Aguardando booster',
		rejected: 'Recusado',
	};

	return labels[status] ?? formatTitleCase(status);
};

const formatGovernanceAction = (type: string) => {
	const labels: Record<string, string> = {
		block_user: 'Bloqueio de usuário',
		force_cancel_order: 'Cancelamento forçado',
		unblock_user: 'Desbloqueio de usuário',
	};

	return labels[type] ?? formatTitleCase(type);
};

export const AdminOrderDetailsView = ({
	currentUserId,
	messages,
	order,
}: AdminOrderDetailsViewProps) => (
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
						<Badge variant="warning">{formatOrderStatus(order.status)}</Badge>
					</div>
					<p className="break-all font-mono text-[10px] text-white/35">
						{order.id}
					</p>
				</div>
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:min-w-[420px]">
					<DefinitionItem
						label="Valor"
						value={formatCurrency(order.totalAmount)}
						valueClassName="text-hextech-cyan"
					/>
					<DefinitionItem
						label="Criado em"
						value={formatDate(order.createdAt)}
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
				<Card className="border-white/10">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<FileText className="h-4 w-4 text-hextech-cyan" />
							Dados do pedido
						</CardTitle>
					</CardHeader>
					<CardContent className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
						<DefinitionItem
							label="Status"
							value={formatOrderStatus(order.status)}
						/>
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
							value={formatDate(order.createdAt)}
						/>
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
							value={order.clientId ?? 'Não informado'}
						/>
						<DefinitionItem
							label="Booster"
							value={order.boosterId ?? 'Não informado'}
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
						<AdminGovernanceForm
							action={forceCancelAdminOrderAction}
							targetId={order.id}
							label="Cancelar pedido"
							placeholder="Motivo obrigatório do cancelamento"
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
					className="h-[560px] max-w-none border-white/10"
				/>
			</div>
		</div>
	</div>
);

export const AdminOrderDetailsPage = async ({
	orderId,
}: AdminOrderDetailsPageProps) => {
	const [orders, chat, currentUserId] = await Promise.all([
		getAdminOrders(),
		getAdminOrderChatMessages(orderId),
		getAdminUserId(),
	]);
	const order = orders.find((item) => item.id === orderId);
	if (!order) notFound();

	return (
		<AdminOrderDetailsView
			order={order}
			messages={chat.items}
			currentUserId={currentUserId}
		/>
	);
};
