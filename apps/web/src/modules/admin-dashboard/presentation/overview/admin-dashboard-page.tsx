import {
	ArrowRight,
	CheckCircle2,
	CircleDollarSign,
	ClipboardCheck,
	Clock,
	FileClock,
	Package,
	Play,
	Shield,
	ShieldCheck,
	Ticket,
	Users,
} from 'lucide-react';
import Link from 'next/link';
import { DashboardEmptyState } from '@/shared/dashboard/dashboard-empty-state';
import { DashboardEntrance } from '@/shared/dashboard/dashboard-entrance';
import { DashboardMetricCard } from '@/shared/dashboard/dashboard-metric-card';
import { DashboardSectionHeader } from '@/shared/dashboard/dashboard-section-header';
import { DashboardTableSection } from '@/shared/dashboard/dashboard-table-section';
import { formatCurrency } from '@/shared/format/currency';
import { formatDateTime } from '@/shared/format/date';
import {
	formatGovernanceAction,
	formatServiceType,
} from '@/shared/format/orders';
import { Badge } from '@/shared/ui/components/badge';
import { getButtonClassName } from '@/shared/ui/components/button';
import { Card } from '@/shared/ui/components/card';
import {
	OrderStatusBadge,
	TicketStatusBadge,
} from '@/shared/ui/components/status-badge';
import {
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/shared/ui/components/table';
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
import { AdminCreateUserForm } from './admin-create-user-form';
import { AdminGovernanceForm } from './admin-governance-form';
import { AdminResendPasswordSetupForm } from './admin-resend-password-setup-form';

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

const formatMetricCount = (value: number) => value.toString().padStart(2, '0');

const roleLabels: Record<string, string> = {
	ADMIN: 'ADMIN',
	BOOSTER: 'BOOSTER',
	CLIENT: 'CLIENTE',
};

const activationLabels: Record<AdminUserOutput['activationStatus'], string> = {
	ACTIVE: 'ATIVO',
	PENDING_ACTIVATION: 'PENDENTE',
	INACTIVE: 'INATIVO',
};

const activationVariants: Record<
	AdminUserOutput['activationStatus'],
	'success' | 'warning' | 'outline'
> = {
	ACTIVE: 'success',
	PENDING_ACTIVATION: 'warning',
	INACTIVE: 'outline',
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

const AdminUserCard = ({ user }: { user: AdminUserOutput }) => (
	<article className="rounded-sm border border-white/10 bg-white/[0.02] p-4">
		<div className="flex items-start justify-between gap-3">
			<div className="min-w-0">
				<p className="truncate text-sm font-black text-white">
					{user.username}
				</p>
				<p className="mt-1 truncate text-xs text-white/45">{user.email}</p>
			</div>
			<Badge>{roleLabels[user.role] ?? user.role}</Badge>
		</div>
		<div className="mt-4 grid grid-cols-2 gap-3 border-white/5 border-t pt-3">
			<Badge variant={activationVariants[user.activationStatus]}>
				{activationLabels[user.activationStatus]}
			</Badge>
			<Badge variant={user.isBlocked ? 'error' : 'success'}>
				{user.isBlocked ? 'BLOQUEADO' : 'LIBERADO'}
			</Badge>
		</div>
		<div className="mt-4">
			<div className="grid gap-3">
				{user.activationStatus === 'PENDING_ACTIVATION' ? (
					<AdminResendPasswordSetupForm userId={user.id} />
				) : null}
				<AdminGovernanceForm
					action={
						user.isBlocked ? unblockAdminUserAction : blockAdminUserAction
					}
					targetId={user.id}
					label={user.isBlocked ? 'Desbloquear' : 'Bloquear'}
					placeholder="Motivo obrigatório da auditoria"
					tone={user.isBlocked ? 'neutral' : 'danger'}
				/>
			</div>
		</div>
	</article>
);

const AdminOrderCard = ({ order }: { order: AdminOrderOutput }) => (
	<Link
		href={`/admin/orders/${encodeURIComponent(order.id)}`}
		className={`rounded-sm border border-white/10 border-l-2 bg-white/[0.02] p-4 transition-colors hover:border-white/20 hover:bg-white/[0.04] ${getOrderAccentClassName(order.status)}`}
	>
		<div className="flex items-start justify-between gap-3">
			<div className="min-w-0">
				<div className="flex items-center gap-2.5">
					<Shield className="h-4 w-4 shrink-0 text-hextech-cyan/70" />
					<p className="truncate text-sm font-black uppercase tracking-wider text-white">
						{formatServiceType(order.serviceType)}
					</p>
				</div>
				<p className="mt-2 break-all font-mono text-[10px] text-white/35">
					{order.id}
				</p>
			</div>
			<OrderStatusBadge status={order.status} />
		</div>
		<div className="mt-4 grid grid-cols-2 gap-3 border-white/5 border-t pt-3">
			<div>
				<p className="text-[10px] font-black uppercase tracking-widest text-white/35">
					Valor
				</p>
				<p className="mt-1 font-black text-white">
					{formatCurrency(order.totalAmount ?? 0)}
				</p>
			</div>
			<div>
				<p className="text-[10px] font-black uppercase tracking-widest text-white/35">
					Partes
				</p>
				<p className="mt-1 text-[10px] text-white/45">
					Cliente {order.clientId ?? 'não informado'}
				</p>
				<p className="mt-1 text-[10px] text-white/45">
					Booster {order.boosterId ?? 'não informado'}
				</p>
			</div>
		</div>
		{order.latestGovernanceAction ? (
			<p className="mt-4 border-white/5 border-t pt-3 text-xs text-white/50">
				{formatGovernanceAction(order.latestGovernanceAction.type)} /{' '}
				{order.latestGovernanceAction.reason}
			</p>
		) : null}
	</Link>
);

const AdminSupportTicketCard = ({
	ticket,
}: {
	ticket: AdminSupportTicketOutput;
}) => (
	<article className="rounded-sm border border-white/10 bg-white/[0.02] p-4">
		<div className="flex items-start justify-between gap-3">
			<p className="min-w-0 truncate text-sm font-black text-white">
				{ticket.subject}
			</p>
			<TicketStatusBadge status={ticket.status} />
		</div>
		<div className="mt-4 grid grid-cols-2 gap-3 border-white/5 border-t pt-3">
			<div>
				<p className="text-[10px] font-black uppercase tracking-widest text-white/35">
					Mensagens
				</p>
				<p className="mt-1 text-white/60">{ticket.messageCount}</p>
			</div>
			<div>
				<p className="text-[10px] font-black uppercase tracking-widest text-white/35">
					Última
				</p>
				<p className="mt-1 text-[10px] text-white/45">
					{formatDateTime(ticket.latestMessageAt)}
				</p>
			</div>
		</div>
	</article>
);

export const AdminDashboardPage = ({
	metrics,
	orders = [],
	tickets = [],
	users = [],
}: AdminDashboardPageProps) => {
	const orderSummary = summarizeOrders(orders);

	return (
		<DashboardEntrance>
			<section className="dashboard-animate flex flex-none flex-col space-y-6">
				<DashboardSectionHeader
					title="Painel Administrativo"
					detail={`${orders.length} pedidos / ${users.length} usuários`}
				/>

				<div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
					{metricItems(metrics).map((item) => (
						<DashboardMetricCard
							key={item.label}
							icon={item.icon}
							label={item.label}
							value={item.value}
						/>
					))}
				</div>

				<div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
					<DashboardMetricCard
						label="Em execução"
						value={formatMetricCount(orderSummary.active)}
						icon={Play}
					/>
					<DashboardMetricCard
						label="Pendentes"
						value={formatMetricCount(orderSummary.pending)}
						icon={Clock}
					/>
					<DashboardMetricCard
						label="Finalizados"
						value={formatMetricCount(orderSummary.completed)}
						icon={CheckCircle2}
					/>
					<DashboardMetricCard
						label="Suporte"
						value={formatMetricCount(tickets.length)}
						icon={Ticket}
					/>
				</div>
			</section>

			<div className="dashboard-animate flex min-h-0 flex-1 flex-col gap-6 xl:grid xl:grid-cols-[1fr_380px]">
				<Card className="flex min-h-0 flex-1 flex-col overflow-hidden border-white/10">
					<div className="flex flex-none items-center justify-between border-b border-white/5 px-5 py-4">
						<div className="flex items-center gap-3">
							<ClipboardCheck className="h-4 w-4 text-hextech-cyan" />
							<h3 className="text-xs font-black uppercase tracking-[0.3em] text-white">
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
					<div className="flex-1 overflow-auto">
						<div className="min-h-full divide-y divide-white/5">
							{orders.slice(0, 10).map((order) => (
								<Link
									key={order.id}
									href={`/admin/orders/${encodeURIComponent(order.id)}`}
									className={`grid items-center gap-4 border-l-2 px-5 py-4 transition-colors hover:bg-white/[0.03] md:grid-cols-[minmax(0,1fr)_150px_110px] ${getOrderAccentClassName(order.status)}`}
								>
									<div className="flex items-center gap-2.5 min-w-0">
										<Shield className="h-4 w-4 text-hextech-cyan/70 shrink-0" />
										<div className="min-w-0">
											<p className="truncate text-sm font-black uppercase text-white leading-tight">
												{formatServiceType(order.serviceType)}
											</p>
											<p className="mt-1 truncate font-mono text-[10px] text-white/35">
												{order.id}
											</p>
										</div>
									</div>
									<div className="justify-self-start md:justify-self-end">
										<OrderStatusBadge status={order.status} />
									</div>
									<p className="text-sm font-black text-white md:text-right">
										{formatCurrency(order.totalAmount ?? 0)}
									</p>
								</Link>
							))}
							{orders.length === 0 ? (
								<DashboardEmptyState
									icon={Package}
									title="Nenhum pedido recente"
									description="Pedidos pagos e em andamento aparecerão aqui para acompanhamento administrativo."
									action={
										<Link
											href="/admin/orders"
											className={getButtonClassName({
												variant: 'outline',
												size: 'sm',
											})}
										>
											Abrir fila
										</Link>
									}
								/>
							) : null}
						</div>
					</div>
				</Card>

				<aside className="grid flex-none gap-6 xl:flex xl:min-h-0 xl:flex-col">
					<Card className="flex min-h-0 flex-col overflow-hidden border-white/10 xl:flex-1">
						<div className="flex flex-none items-center justify-between border-b border-white/5 px-5 py-4">
							<h3 className="text-xs font-black uppercase tracking-[0.3em] text-white">
								Usuários
							</h3>
							<Link
								href="/admin/users"
								className="text-[10px] font-black uppercase tracking-widest text-white/45 transition-colors hover:text-hextech-cyan"
							>
								Gerenciar
							</Link>
						</div>
						<div className="flex-1 overflow-auto divide-y divide-white/5">
							{users.slice(0, 6).map((user) => (
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
							{users.length === 0 ? (
								<DashboardEmptyState
									icon={Users}
									title="Nenhum usuário"
									description="Usuários ativos aparecerão aqui quando a API retornar dados."
								/>
							) : null}
						</div>
					</Card>

					<Card className="flex min-h-0 flex-col overflow-hidden border-white/10 xl:flex-1">
						<div className="flex flex-none items-center justify-between border-b border-white/5 px-5 py-4">
							<h3 className="text-xs font-black uppercase tracking-[0.3em] text-white">
								Suporte
							</h3>
							<Link
								href="/admin/support"
								className="text-[10px] font-black uppercase tracking-widest text-white/45 transition-colors hover:text-hextech-cyan"
							>
								Ver tickets
							</Link>
						</div>
						<div className="flex-1 overflow-auto divide-y divide-white/5">
							{tickets.slice(0, 6).map((ticket) => (
								<div key={ticket.id} className="px-5 py-3">
									<div className="flex items-center justify-between gap-4">
										<p className="truncate text-sm font-black text-white">
											{ticket.subject}
										</p>
										<TicketStatusBadge status={ticket.status} />
									</div>
									<p className="mt-1 text-[10px] text-white/35">
										{ticket.messageCount} mensagens /{' '}
										{formatDateTime(ticket.latestMessageAt)}
									</p>
								</div>
							))}
							{tickets.length === 0 ? (
								<DashboardEmptyState
									icon={Ticket}
									title="Nenhum ticket aberto"
									description="Chamados de suporte aparecerão aqui para triagem rápida."
									action={
										<Link
											href="/admin/support"
											className={getButtonClassName({
												variant: 'outline',
												size: 'sm',
											})}
										>
											Ver tickets
										</Link>
									}
								/>
							) : null}
						</div>
					</Card>
				</aside>
			</div>
		</DashboardEntrance>
	);
};

export const AdminUsersPage = ({ users }: AdminUsersPageProps) => {
	const blockedUsers = users.filter((user) => user.isBlocked).length;
	const boosters = users.filter((user) => user.role === 'BOOSTER').length;
	const clients = users.filter((user) => user.role === 'CLIENT').length;

	return (
		<DashboardEntrance>
			<section className="dashboard-animate flex-none space-y-4">
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
				<AdminCreateUserForm />
			</section>
			<DashboardTableSection
				isEmpty={users.length === 0}
				colSpan={6}
				mobileContent={users.map((user) => (
					<AdminUserCard key={user.id} user={user} />
				))}
				emptyState={
					<DashboardEmptyState
						icon={Users}
						title="Nenhum usuário encontrado"
						description="Os usuários retornados pela API aparecerão aqui para revisão administrativa."
					/>
				}
			>
				<TableHeader>
					<TableRow>
						<TableHead>Usuário</TableHead>
						<TableHead>Perfil</TableHead>
						<TableHead>Conta</TableHead>
						<TableHead>Criado em</TableHead>
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
									<p className="truncate text-xs text-white/45">{user.email}</p>
								</div>
							</TableCell>
							<TableCell>
								<Badge>{roleLabels[user.role] ?? user.role}</Badge>
							</TableCell>
							<TableCell>
								<Badge variant={activationVariants[user.activationStatus]}>
									{activationLabels[user.activationStatus]}
								</Badge>
							</TableCell>
							<TableCell className="text-xs text-white/45">
								{formatDateTime(user.createdAt)}
							</TableCell>
							<TableCell>
								<Badge variant={user.isBlocked ? 'error' : 'success'}>
									{user.isBlocked ? 'BLOQUEADO' : 'LIBERADO'}
								</Badge>
							</TableCell>
							<TableCell className="min-w-[240px] text-right">
								<div className="grid justify-items-end gap-3">
									{user.activationStatus === 'PENDING_ACTIVATION' ? (
										<AdminResendPasswordSetupForm userId={user.id} />
									) : null}
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
								</div>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</DashboardTableSection>
		</DashboardEntrance>
	);
};

export const AdminOrdersPage = ({ orders }: AdminOrdersPageProps) => (
	<DashboardEntrance>
		<DashboardTableSection
			header={
				<DashboardSectionHeader
					title="Pedidos"
					detail={`${orders.length} recentes`}
				/>
			}
			isEmpty={orders.length === 0}
			colSpan={6}
			emptyState={
				<DashboardEmptyState
					icon={Package}
					title="Nenhum pedido encontrado"
					description="Pedidos recentes retornados pela API aparecerão aqui."
				/>
			}
			mobileContent={orders.map((order) => (
				<AdminOrderCard key={order.id} order={order} />
			))}
		>
			<TableHeader>
				<TableRow>
					<TableHead>Pedido</TableHead>
					<TableHead>Status</TableHead>
					<TableHead>Valor</TableHead>
					<TableHead>Partes</TableHead>
					<TableHead>Última ação</TableHead>
					<TableHead className="text-right">Detalhes</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{orders.map((order) => (
					<TableRow key={order.id}>
						<TableCell>
							<div className="flex items-center gap-2.5">
								<Shield className="h-4 w-4 text-hextech-cyan/70 shrink-0" />
								<div className="space-y-1">
									<p className="font-black uppercase tracking-wider text-white leading-tight">
										{formatServiceType(order.serviceType)}
									</p>
									<p className="max-w-[190px] truncate font-mono text-[10px] text-white/45">
										{order.id}
									</p>
								</div>
							</div>
						</TableCell>
						<TableCell>
							<OrderStatusBadge status={order.status} />
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
						<TableCell className="max-w-[240px] text-xs text-white/55">
							{order.latestGovernanceAction ? (
								<span>
									{formatGovernanceAction(order.latestGovernanceAction.type)} /{' '}
									{order.latestGovernanceAction.reason}
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
		</DashboardTableSection>
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
			<section className="dashboard-animate flex-none space-y-4">
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
			</section>
			<DashboardTableSection
				isEmpty={tickets.length === 0}
				colSpan={4}
				mobileContent={tickets.map((ticket) => (
					<AdminSupportTicketCard key={ticket.id} ticket={ticket} />
				))}
				emptyState={
					<DashboardEmptyState
						icon={Ticket}
						title="Nenhum ticket encontrado"
						description="Chamados de suporte retornados pela API aparecerão aqui."
					/>
				}
			>
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
							<TableCell>
								<TicketStatusBadge status={ticket.status} />
							</TableCell>
							<TableCell>{ticket.messageCount} mensagens</TableCell>
							<TableCell className="text-[10px] uppercase tracking-widest text-white/35">
								{formatDateTime(ticket.latestMessageAt)}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</DashboardTableSection>
		</DashboardEntrance>
	);
};
