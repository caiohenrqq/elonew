import { Badge } from '@packages/ui/components/badge';
import { getButtonClassName } from '@packages/ui/components/button';
import { Card } from '@packages/ui/components/card';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@packages/ui/components/table';
import {
	ArrowRight,
	CircleDollarSign,
	ClipboardCheck,
	FileClock,
	MessageSquare,
	Package,
	ShieldCheck,
	Ticket,
	Users,
} from 'lucide-react';
import Link from 'next/link';
import { DashboardEmptyState } from '@/shared/dashboard/dashboard-empty-state';
import { DashboardEntrance } from '@/shared/dashboard/dashboard-entrance';
import { DashboardMetricCard } from '@/shared/dashboard/dashboard-metric-card';
import { DashboardSectionHeader } from '@/shared/dashboard/dashboard-section-header';
import {
	blockAdminUserAction,
	unblockAdminUserAction,
} from '../../actions/admin-actions';
import type {
	AdminMetricsOutput,
	AdminOrderOutput,
	AdminSupportTicketOutput,
	AdminUserOutput,
} from '../../server/admin-contracts';
import { AdminGovernanceForm } from './admin-governance-form';

type AdminDashboardPageProps = {
	metrics: AdminMetricsOutput;
	orders?: AdminOrderOutput[];
	tickets?: AdminSupportTicketOutput[];
	users?: AdminUserOutput[];
};

type AdminUsersPageProps = {
	users: AdminUserOutput[];
};

type AdminOrdersPageProps = {
	orders: AdminOrderOutput[];
};

type AdminSupportPageProps = {
	tickets: AdminSupportTicketOutput[];
};

const formatCurrency = (value: number) =>
	new Intl.NumberFormat('pt-BR', {
		style: 'currency',
		currency: 'BRL',
	}).format(value);

const formatDate = (value: string | null) =>
	value
		? new Intl.DateTimeFormat('pt-BR', {
				dateStyle: 'short',
				timeStyle: 'short',
			}).format(new Date(value))
		: 'Não informado';

const formatMetricCount = (value: number) => value.toString().padStart(2, '0');

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

const formatTicketStatus = (status: string) => {
	const labels: Record<string, string> = {
		CLOSED: 'Fechado',
		OPEN: 'Aberto',
		PENDING: 'Pendente',
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

const roleLabels: Record<string, string> = {
	ADMIN: 'ADMIN',
	BOOSTER: 'BOOSTER',
	CLIENT: 'CLIENTE',
};

const metricItems = (metrics: AdminMetricsOutput) => [
	{
		label: 'Receita',
		value: formatCurrency(metrics.revenueTotal),
		icon: CircleDollarSign,
	},
	{
		label: 'Pedidos',
		value: formatMetricCount(metrics.ordersTotal),
		icon: FileClock,
	},
	{
		label: 'Pedidos ativos',
		value: formatMetricCount(metrics.activeOrders),
		icon: ShieldCheck,
	},
	{
		label: 'Usuários ativos',
		value: formatMetricCount(metrics.activeUsers),
		icon: Users,
	},
];

const getOrderAccentClassName = (status: string) => {
	if (status === 'in_progress') return 'border-l-hextech-cyan';
	if (status === 'completed') return 'border-l-emerald-400';
	if (status === 'cancelled' || status === 'rejected')
		return 'border-l-red-400';
	return 'border-l-amber-400';
};

const summarizeOrders = (orders: AdminOrderOutput[]) => {
	const active = orders.filter(
		(order) => order.status === 'in_progress',
	).length;
	const completed = orders.filter(
		(order) => order.status === 'completed',
	).length;
	const pending = orders.filter((order) =>
		['awaiting_payment', 'paid', 'pending_booster'].includes(order.status),
	).length;

	return { active, completed, pending };
};

export const AdminDashboardPage = ({
	metrics,
	orders = [],
	tickets = [],
	users = [],
}: AdminDashboardPageProps) => {
	const orderSummary = summarizeOrders(orders);

	return (
		<DashboardEntrance>
			<section className="dashboard-animate space-y-6">
				<DashboardSectionHeader
					title="Painel Administrativo"
					detail={`${orders.length} pedidos / ${users.length} usuários`}
				/>

				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
					{metricItems(metrics).map((item) => (
						<DashboardMetricCard
							key={item.label}
							icon={item.icon}
							label={item.label}
							value={item.value}
						/>
					))}
				</div>

				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					<DashboardMetricCard
						label="Em execução"
						value={formatMetricCount(orderSummary.active)}
					/>
					<DashboardMetricCard
						label="Pendentes"
						value={formatMetricCount(orderSummary.pending)}
					/>
					<DashboardMetricCard
						label="Finalizados"
						value={formatMetricCount(orderSummary.completed)}
					/>
				</div>

				<div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
					<Card className="overflow-hidden border-white/10">
						<div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
							<div className="flex items-center gap-3">
								<ClipboardCheck className="h-4 w-4 text-hextech-cyan" />
								<h3 className="text-xs font-black uppercase tracking-[0.22em] text-white">
									Pedidos recentes
								</h3>
							</div>
							<Link
								href="/admin/orders"
								className="text-[10px] font-black uppercase tracking-widest text-white/45 transition-colors hover:text-hextech-cyan"
							>
								Abrir fila
							</Link>
						</div>
						<div className="divide-y divide-white/5">
							{orders.slice(0, 5).map((order) => (
								<Link
									key={order.id}
									href={`/admin/orders/${encodeURIComponent(order.id)}`}
									className={`grid items-center gap-4 border-l-2 px-5 py-4 transition-colors hover:bg-white/[0.03] md:grid-cols-[minmax(0,1fr)_150px_110px] ${getOrderAccentClassName(order.status)}`}
								>
									<div className="min-w-0">
										<p className="truncate text-sm font-black uppercase text-white">
											{formatServiceType(order.serviceType)}
										</p>
										<p className="mt-1 truncate font-mono text-[10px] text-white/35">
											{order.id}
										</p>
									</div>
									<div className="justify-self-start md:justify-self-end">
										<Badge variant="warning">
											{formatOrderStatus(order.status)}
										</Badge>
									</div>
									<p className="text-sm font-black text-white md:text-right">
										{formatCurrency(order.totalAmount ?? 0)}
									</p>
								</Link>
							))}
							{orders.length === 0 ? (
								<div className="p-5 text-sm text-white/40">
									Nenhum pedido recente.
								</div>
							) : null}
						</div>
					</Card>

					<div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-1">
						<Card className="overflow-hidden border-white/10">
							<div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
								<h3 className="text-xs font-black uppercase tracking-[0.22em] text-white">
									Usuários
								</h3>
								<Link
									href="/admin/users"
									className="text-[10px] font-black uppercase tracking-widest text-white/45 transition-colors hover:text-hextech-cyan"
								>
									Gerenciar
								</Link>
							</div>
							<div className="divide-y divide-white/5">
								{users.slice(0, 4).map((user) => (
									<div
										key={user.id}
										className="flex items-center justify-between gap-4 px-5 py-3"
									>
										<div className="min-w-0">
											<p className="truncate text-sm font-black text-white">
												{user.username}
											</p>
											<p className="truncate text-[10px] text-white/35">
												{user.email}
											</p>
										</div>
										<Badge>{roleLabels[user.role] ?? user.role}</Badge>
									</div>
								))}
							</div>
						</Card>

						<Card className="overflow-hidden border-white/10">
							<div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
								<h3 className="text-xs font-black uppercase tracking-[0.22em] text-white">
									Suporte
								</h3>
								<Link
									href="/admin/support"
									className="text-[10px] font-black uppercase tracking-widest text-white/45 transition-colors hover:text-hextech-cyan"
								>
									Ver tickets
								</Link>
							</div>
							<div className="divide-y divide-white/5">
								{tickets.slice(0, 4).map((ticket) => (
									<div key={ticket.id} className="px-5 py-3">
										<div className="flex items-center justify-between gap-4">
											<p className="truncate text-sm font-black text-white">
												{ticket.subject}
											</p>
											<Badge>{formatTicketStatus(ticket.status)}</Badge>
										</div>
										<p className="mt-1 text-[10px] text-white/35">
											{ticket.messageCount} mensagens /{' '}
											{formatDate(ticket.latestMessageAt)}
										</p>
									</div>
								))}
								{tickets.length === 0 ? (
									<div className="p-5 text-sm text-white/40">
										Nenhum ticket aberto.
									</div>
								) : null}
							</div>
						</Card>
					</div>
				</div>
			</section>
		</DashboardEntrance>
	);
};

export const AdminUsersPage = ({ users }: AdminUsersPageProps) => {
	const blockedUsers = users.filter((user) => user.isBlocked).length;
	const boosters = users.filter((user) => user.role === 'BOOSTER').length;
	const clients = users.filter((user) => user.role === 'CLIENT').length;

	return (
		<DashboardEntrance>
			<section className="dashboard-animate space-y-4">
				<DashboardSectionHeader
					title="Usuários"
					detail={`${users.length} carregados`}
				/>
				<div className="grid gap-4 md:grid-cols-4">
					<DashboardMetricCard
						label="Total"
						value={formatMetricCount(users.length)}
					/>
					<DashboardMetricCard
						label="Clientes"
						value={formatMetricCount(clients)}
					/>
					<DashboardMetricCard
						label="Boosters"
						value={formatMetricCount(boosters)}
					/>
					<DashboardMetricCard
						label="Bloqueados"
						value={formatMetricCount(blockedUsers)}
					/>
				</div>
				<Card className="overflow-hidden border-white/10">
					{users.length > 0 ? (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Usuário</TableHead>
									<TableHead>Perfil</TableHead>
									<TableHead>Conta</TableHead>
									<TableHead>Bloqueio</TableHead>
									<TableHead className="text-right">Admin</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{users.map((user) => (
									<TableRow key={user.id}>
										<TableCell>
											<div className="min-w-0 space-y-1">
												<p className="truncate text-sm font-black text-white">
													{user.username}
												</p>
												<p className="truncate text-xs text-white/45">
													{user.email}
												</p>
											</div>
										</TableCell>
										<TableCell>
											<Badge>{roleLabels[user.role] ?? user.role}</Badge>
										</TableCell>
										<TableCell>
											<Badge variant={user.isActive ? 'success' : 'outline'}>
												{user.isActive ? 'ATIVO' : 'INATIVO'}
											</Badge>
										</TableCell>
										<TableCell>
											<Badge variant={user.isBlocked ? 'error' : 'success'}>
												{user.isBlocked ? 'BLOQUEADO' : 'LIBERADO'}
											</Badge>
										</TableCell>
										<TableCell className="min-w-[240px] text-right">
											<AdminGovernanceForm
												action={
													user.isBlocked
														? unblockAdminUserAction
														: blockAdminUserAction
												}
												targetId={user.id}
												label={user.isBlocked ? 'Desbloquear' : 'Bloquear'}
												placeholder="Motivo obrigatório da auditoria"
												tone={user.isBlocked ? 'neutral' : 'danger'}
											/>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					) : (
						<DashboardEmptyState
							icon={Users}
							title="Nenhum usuário encontrado"
							description="Os usuários retornados pela API aparecerão aqui para revisão administrativa."
						/>
					)}
				</Card>
			</section>
		</DashboardEntrance>
	);
};

export const AdminOrdersPage = ({ orders }: AdminOrdersPageProps) => (
	<DashboardEntrance>
		<section className="dashboard-animate space-y-4">
			<DashboardSectionHeader
				title="Pedidos"
				detail={`${orders.length} recentes`}
			/>
			<Card className="overflow-hidden border-white/10">
				{orders.length > 0 ? (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Pedido</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Valor</TableHead>
								<TableHead>Partes</TableHead>
								<TableHead>Chat</TableHead>
								<TableHead>Última ação</TableHead>
								<TableHead className="text-right">Detalhes</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{orders.map((order) => (
								<TableRow key={order.id}>
									<TableCell>
										<div className="space-y-1">
											<p className="font-black uppercase tracking-wider text-white">
												{formatServiceType(order.serviceType)}
											</p>
											<p className="max-w-[190px] truncate font-mono text-[10px] text-white/45">
												{order.id}
											</p>
										</div>
									</TableCell>
									<TableCell>
										<Badge variant="warning">
											{formatOrderStatus(order.status)}
										</Badge>
									</TableCell>
									<TableCell className="font-black text-white">
										{formatCurrency(order.totalAmount ?? 0)}
									</TableCell>
									<TableCell>
										<p className="text-[10px] uppercase tracking-widest text-white/35">
											Cliente {order.clientId ?? 'não informado'}
										</p>
										<p className="mt-1 text-[10px] uppercase tracking-widest text-white/35">
											Booster {order.boosterId ?? 'não informado'}
										</p>
									</TableCell>
									<TableCell>
										<div className="flex items-center gap-2 text-[10px] font-bold text-white/45">
											<MessageSquare className="h-3.5 w-3.5 text-hextech-cyan/70" />
											Histórico
										</div>
									</TableCell>
									<TableCell className="max-w-[240px] text-xs text-white/55">
										{order.latestGovernanceAction ? (
											<span>
												{formatGovernanceAction(
													order.latestGovernanceAction.type,
												)}{' '}
												/ {order.latestGovernanceAction.reason}
											</span>
										) : (
											'Nenhuma'
										)}
									</TableCell>
									<TableCell className="text-right">
										<Link
											href={`/admin/orders/${encodeURIComponent(order.id)}`}
											className={getButtonClassName({
												size: 'sm',
												variant: 'outline',
												className: 'gap-2',
											})}
										>
											Ver detalhes
											<ArrowRight className="h-3.5 w-3.5" />
										</Link>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				) : (
					<DashboardEmptyState
						icon={Package}
						title="Nenhum pedido encontrado"
						description="Pedidos recentes retornados pela API aparecerão aqui."
					/>
				)}
			</Card>
		</section>
	</DashboardEntrance>
);

export const AdminSupportPage = ({ tickets }: AdminSupportPageProps) => {
	const openTickets = tickets.filter(
		(ticket) => ticket.status === 'OPEN',
	).length;
	const pendingTickets = tickets.filter(
		(ticket) => ticket.status === 'PENDING',
	).length;
	const totalMessages = tickets.reduce(
		(total, ticket) => total + ticket.messageCount,
		0,
	);

	return (
		<DashboardEntrance>
			<section className="dashboard-animate space-y-4">
				<DashboardSectionHeader
					title="Suporte"
					detail={`${tickets.length} tickets`}
				/>
				<div className="grid gap-4 md:grid-cols-3">
					<DashboardMetricCard
						label="Abertos"
						value={formatMetricCount(openTickets)}
					/>
					<DashboardMetricCard
						label="Pendentes"
						value={formatMetricCount(pendingTickets)}
					/>
					<DashboardMetricCard
						label="Mensagens"
						value={formatMetricCount(totalMessages)}
					/>
				</div>
				<Card className="overflow-hidden border-white/10">
					{tickets.length > 0 ? (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Chamado</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Mensagens</TableHead>
									<TableHead>Última mensagem</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{tickets.map((ticket) => (
									<TableRow key={ticket.id}>
										<TableCell>
											<p className="truncate text-sm font-black text-white">
												{ticket.subject}
											</p>
										</TableCell>
										<TableCell>{formatTicketStatus(ticket.status)}</TableCell>
										<TableCell>{ticket.messageCount} mensagens</TableCell>
										<TableCell className="text-[10px] uppercase tracking-widest text-white/35">
											{formatDate(ticket.latestMessageAt)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					) : (
						<DashboardEmptyState
							icon={Ticket}
							title="Nenhum ticket encontrado"
							description="Chamados de suporte retornados pela API aparecerão aqui."
						/>
					)}
				</Card>
			</section>
		</DashboardEntrance>
	);
};
