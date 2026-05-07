import { Badge } from '@packages/ui/components/badge';
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
	CircleDollarSign,
	FileClock,
	Package,
	ShieldCheck,
	Ticket,
	Users,
} from 'lucide-react';
import { DashboardEmptyState } from '@/shared/dashboard/dashboard-empty-state';
import { DashboardEntrance } from '@/shared/dashboard/dashboard-entrance';
import { DashboardMetricCard } from '@/shared/dashboard/dashboard-metric-card';
import { DashboardSectionHeader } from '@/shared/dashboard/dashboard-section-header';
import {
	blockAdminUserAction,
	forceCancelAdminOrderAction,
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

export const AdminDashboardPage = ({ metrics }: AdminDashboardPageProps) => {
	return (
		<DashboardEntrance>
			<section className="dashboard-animate space-y-5">
				<DashboardSectionHeader
					title="Painel Administrativo"
					detail="Governança"
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
			</section>
		</DashboardEntrance>
	);
};

export const AdminUsersPage = ({ users }: AdminUsersPageProps) => (
	<DashboardEntrance>
		<section className="dashboard-animate space-y-4">
			<DashboardSectionHeader
				title="Usuários"
				detail={`${users.length} carregados`}
			/>
			<Card className="overflow-hidden">
				{users.length > 0 ? (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Usuário</TableHead>
								<TableHead>Perfil</TableHead>
								<TableHead>Conta</TableHead>
								<TableHead>Bloqueio</TableHead>
								<TableHead className="text-right">Governança</TableHead>
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
									<TableCell className="min-w-[240px]">
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

export const AdminOrdersPage = ({ orders }: AdminOrdersPageProps) => (
	<DashboardEntrance>
		<section className="dashboard-animate space-y-4">
			<DashboardSectionHeader
				title="Pedidos"
				detail={`${orders.length} recentes`}
			/>
			<Card className="overflow-hidden">
				{orders.length > 0 ? (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Pedido</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Valor</TableHead>
								<TableHead>Partes</TableHead>
								<TableHead>Última ação</TableHead>
								<TableHead className="text-right">Governança</TableHead>
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
											<p className="truncate font-mono text-[10px] text-white/45">
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
										<p className="mt-1 text-[10px] uppercase tracking-widest text-white/35">
											{formatDate(order.createdAt)}
										</p>
									</TableCell>
									<TableCell className="max-w-[280px] text-xs text-white/55">
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
									<TableCell className="min-w-[240px]">
										<AdminGovernanceForm
											action={forceCancelAdminOrderAction}
											targetId={order.id}
											label="Cancelar"
											placeholder="Motivo obrigatório do cancelamento"
											tone="danger"
										/>
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

export const AdminSupportPage = ({ tickets }: AdminSupportPageProps) => (
	<DashboardEntrance>
		<section className="dashboard-animate space-y-4">
			<DashboardSectionHeader
				title="Suporte"
				detail={`${tickets.length} tickets`}
			/>
			<Card className="overflow-hidden">
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
