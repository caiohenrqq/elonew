import {
	Activity,
	ArrowRight,
	Coins,
	Package,
	PlusCircle,
	Shield,
	Ticket,
} from 'lucide-react';
import Link from 'next/link';
import { DashboardEmptyState } from '@/shared/dashboard/dashboard-empty-state';
import { DashboardEntrance } from '@/shared/dashboard/dashboard-entrance';
import { DashboardMetricCard } from '@/shared/dashboard/dashboard-metric-card';
import { DashboardTableSection } from '@/shared/dashboard/dashboard-table-section';
import { formatCurrency } from '@/shared/format/currency';
import { formatDate, formatDateTime } from '@/shared/format/date';
import { formatServiceType } from '@/shared/format/orders';
import {
	type ButtonVariant,
	getButtonClassName,
} from '@/shared/ui/components/button';
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
import type { ClientDashboardTab } from '../../model/client-tabs';
import type { ClientDashboard, ClientDashboardOrder } from '../../model/orders';
import type { SupportTicketOutput } from '../../server/ticket-contracts';
import { OrderRankRoute } from '../order-rank-route';
import { ClientDashboardLiveRefresh } from './client-dashboard-live-refresh';
import { DevelopmentCheckoutModal } from './development-checkout-modal';

type ClientDashboardPageProps = {
	dashboard?: ClientDashboard;
	devPaymentId?: string;
	tab?: ClientDashboardTab;
	tickets?: SupportTicketOutput[];
};

const formatMetricCount = (value: number) => value.toString().padStart(2, '0');

const paymentRequiredStatuses = new Set(['awaiting_payment']);
const activeStatuses = new Set([
	'awaiting_payment',
	'pending_booster',
	'in_progress',
]);

const getOrderActionLabel = (status: string) => {
	if (paymentRequiredStatuses.has(status)) return 'Pagar';
	if (activeStatuses.has(status)) return 'Verificar';
	return 'Detalhes';
};

const getOrderActionVariant = (status: string): ButtonVariant =>
	paymentRequiredStatuses.has(status) ? 'primary' : 'outline';

const ClientOrderCard = ({ order }: { order: ClientDashboardOrder }) => (
	<Link
		href={`/client/orders/${order.id}`}
		className="rounded-sm border border-white/10 bg-white/[0.02] p-4 transition-colors hover:border-hextech-cyan/30 hover:bg-white/[0.04]"
	>
		<div className="flex items-start justify-between gap-3">
			<div className="min-w-0">
				<div className="flex items-center gap-2.5">
					<Shield className="h-4 w-4 shrink-0 text-hextech-cyan/70" />
					<p className="truncate font-black text-sm text-white uppercase tracking-wider">
						{formatServiceType(order.serviceType)}
					</p>
				</div>
				<p className="mt-2">
					<OrderRankRoute
						currentLeague={order.currentLeague}
						currentDivision={order.currentDivision}
						desiredLeague={order.desiredLeague}
						desiredDivision={order.desiredDivision}
					/>
				</p>
			</div>
			<OrderStatusBadge status={order.status} />
		</div>
		<div className="mt-4 grid grid-cols-2 gap-3 border-white/5 border-t pt-3">
			<div>
				<p className="text-[10px] font-black text-white/35 uppercase tracking-widest">
					Valor
				</p>
				<p className="mt-1 font-black text-white">
					{formatCurrency(order.totalAmount)}
				</p>
			</div>
			<div>
				<p className="text-[10px] font-black text-white/35 uppercase tracking-widest">
					Data
				</p>
				<p className="mt-1 text-white/60">{formatDate(order.createdAt)}</p>
			</div>
		</div>
		<div className="mt-4">
			<span
				className={getButtonClassName({
					variant: getOrderActionVariant(order.status),
					size: 'sm',
					className: 'gap-2 font-black uppercase tracking-widest',
				})}
			>
				{getOrderActionLabel(order.status)}
			</span>
		</div>
	</Link>
);

const ClientOrderRow = ({ order }: { order: ClientDashboardOrder }) => (
	<TableRow>
		<TableCell className="font-mono text-[10px] text-white/60">
			{order.id}
		</TableCell>
		<TableCell>
			<div className="flex items-center gap-2.5">
				<Shield className="w-4 h-4 text-hextech-cyan/70 shrink-0" />
				<span className="font-black uppercase tracking-wider text-white leading-none">
					{formatServiceType(order.serviceType)}
				</span>
			</div>
		</TableCell>
		<TableCell>
			<div className="space-y-1">
				<OrderRankRoute
					currentLeague={order.currentLeague}
					currentDivision={order.currentDivision}
					desiredLeague={order.desiredLeague}
					desiredDivision={order.desiredDivision}
				/>
				<p className="text-[10px] uppercase tracking-widest text-white/35">
					{formatCurrency(order.totalAmount)}
				</p>
			</div>
		</TableCell>
		<TableCell>
			<OrderStatusBadge status={order.status} />
		</TableCell>
		<TableCell className="text-white/50">
			{formatDate(order.createdAt)}
		</TableCell>
		<TableCell className="text-right">
			<Link
				href={`/client/orders/${order.id}`}
				className={getButtonClassName({
					variant: getOrderActionVariant(order.status),
					size: 'sm',
					className: 'gap-2 font-black uppercase tracking-widest',
				})}
			>
				{getOrderActionLabel(order.status)}
				<ArrowRight className="w-3 h-3" />
			</Link>
		</TableCell>
	</TableRow>
);

const ClientOrdersEmptyState = () => (
	<DashboardEmptyState
		icon={Package}
		title="Nenhum pedido encontrado"
		description="Crie seu primeiro pedido para acompanhar status, pagamento e progresso por aqui."
		action={
			<Link
				href="/client/orders/new"
				className={getButtonClassName({ size: 'sm', className: 'gap-2' })}
			>
				<PlusCircle className="h-3 w-3" />
				Novo Pedido
			</Link>
		}
	/>
);

const TicketHistoryCard = ({ ticket }: { ticket: SupportTicketOutput }) => (
	<article className="rounded-sm border border-white/10 bg-white/[0.02] p-4">
		<div className="flex items-start justify-between gap-3">
			<div className="min-w-0">
				<p className="truncate text-sm font-black text-white">
					{ticket.subject}
				</p>
				<p className="mt-2 break-all font-mono text-[10px] text-white/35">
					{ticket.id}
				</p>
			</div>
			<TicketStatusBadge status={ticket.status} />
		</div>
		<div className="mt-4 grid grid-cols-2 gap-3 border-white/5 border-t pt-3">
			<div>
				<p className="text-[10px] font-black uppercase tracking-widest text-white/35">
					Pedido
				</p>
				<p className="mt-1 break-all text-[10px] text-white/45">
					{ticket.orderId ?? 'Ticket geral'}
				</p>
			</div>
			<div>
				<p className="text-[10px] font-black uppercase tracking-widest text-white/35">
					Atualizado
				</p>
				<p className="mt-1 text-[10px] text-white/45">
					{formatDateTime(ticket.updatedAt)}
				</p>
			</div>
		</div>
	</article>
);

const TicketHistoryEmptyState = () => (
	<DashboardEmptyState
		icon={Ticket}
		title="Nenhum ticket encontrado"
		description="Crie um novo ticket quando precisar falar com o suporte."
		action={
			<Link
				href="/client/tickets/new"
				className={getButtonClassName({ size: 'sm', className: 'gap-2' })}
			>
				<PlusCircle className="h-3 w-3" />
				Novo Ticket
			</Link>
		}
	/>
);

const TicketHistorySection = ({
	tickets,
}: {
	tickets: SupportTicketOutput[];
}) => (
	<DashboardTableSection
		className="space-y-6"
		colSpan={5}
		isEmpty={tickets.length === 0}
		header={
			<div className="flex flex-none flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
				<div className="space-y-1">
					<h2 className="text-xs font-black uppercase tracking-[0.3em] text-white">
						Tickets
					</h2>
					<p className="text-[10px] text-white/40 tracking-wider">
						Acompanhe o histórico dos seus chamados de suporte.
					</p>
				</div>
				<Link
					href="/client/tickets/new"
					className={getButtonClassName({
						size: 'sm',
						className: 'gap-2 font-black uppercase tracking-widest',
					})}
				>
					<PlusCircle className="w-3 h-3" />
					Novo Ticket
				</Link>
			</div>
		}
		emptyState={<TicketHistoryEmptyState />}
		mobileContent={tickets.map((ticket) => (
			<TicketHistoryCard key={ticket.id} ticket={ticket} />
		))}
	>
		<TableHeader>
			<TableRow>
				<TableHead>Ticket</TableHead>
				<TableHead>Status</TableHead>
				<TableHead>Pedido</TableHead>
				<TableHead>Atualizado</TableHead>
				<TableHead className="text-right">Mensagens</TableHead>
			</TableRow>
		</TableHeader>
		<TableBody>
			{tickets.map((ticket) => (
				<TableRow key={ticket.id}>
					<TableCell>
						<div className="space-y-1">
							<p className="truncate text-sm font-black text-white">
								{ticket.subject}
							</p>
							<p className="max-w-55 truncate font-mono text-[10px] text-white/35">
								{ticket.id}
							</p>
						</div>
					</TableCell>
					<TableCell>
						<TicketStatusBadge status={ticket.status} />
					</TableCell>
					<TableCell className="max-w-55 break-all text-xs text-white/55">
						{ticket.orderId ?? 'Ticket geral'}
					</TableCell>
					<TableCell className="text-[10px] uppercase tracking-widest text-white/35">
						{formatDateTime(ticket.updatedAt)}
					</TableCell>
					<TableCell className="text-right font-mono text-white/60">
						{(ticket.messageCount ?? 0).toString().padStart(2, '0')}
					</TableCell>
				</TableRow>
			))}
		</TableBody>
	</DashboardTableSection>
);

export const ClientDashboardPage = ({
	dashboard,
	devPaymentId,
	tab = 'overview',
	tickets = [],
}: ClientDashboardPageProps) => {
	const orders = dashboard?.orders ?? [];
	const activeOrders = orders.filter((order) =>
		activeStatuses.has(order.status),
	);
	const selectedOrders = orders;
	const isOrdersTab = tab === 'orders';
	const isTicketsTab = tab === 'tickets';
	const activeProgress =
		dashboard && dashboard.summary.totalOrders > 0
			? (activeOrders.length / dashboard.summary.totalOrders) * 100
			: 0;

	return (
		<DashboardEntrance>
			<ClientDashboardLiveRefresh />
			{devPaymentId ? (
				<DevelopmentCheckoutModal devPaymentId={devPaymentId} />
			) : null}

			{isTicketsTab ? <TicketHistorySection tickets={tickets} /> : null}

			{isOrdersTab || isTicketsTab ? null : (
				<div className="grid flex-none grid-cols-1 gap-6 md:grid-cols-2">
					<div className="dashboard-animate h-full">
						<DashboardMetricCard
							label="Pedidos ativos"
							value={formatMetricCount(activeOrders.length)}
							icon={Activity}
						>
							<div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
								<div
									className="h-full bg-hextech-cyan"
									data-testid="active-orders-progress"
									style={{ width: `${activeProgress}%` }}
								/>
							</div>
						</DashboardMetricCard>
					</div>
					<div className="dashboard-animate h-full">
						<DashboardMetricCard
							label="Total investido"
							value={formatCurrency(dashboard?.summary.totalInvested ?? 0)}
							icon={Coins}
						>
							<p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
								{(dashboard?.summary.totalInvested ?? 0) > 0
									? 'Sua evolução acumulada na plataforma'
									: 'Crie um pedido para começar'}
							</p>
						</DashboardMetricCard>
					</div>
				</div>
			)}

			{isTicketsTab ? null : (
				<div className="flex min-h-0 flex-1 flex-col gap-6">
					<DashboardTableSection
						className="space-y-6"
						colSpan={6}
						isEmpty={selectedOrders.length === 0}
						scrollAreaTestId="client-orders-table-scroll-area"
						header={
							<div className="flex flex-none flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
								<div className="space-y-1">
									<h2 className="text-xs font-black uppercase tracking-[0.3em] text-white">
										{isOrdersTab ? 'Pedidos' : 'Pedidos recentes'}
									</h2>
									<p className="text-[10px] text-white/40 tracking-wider">
										{isOrdersTab
											? 'Todos os pedidos carregados para consulta.'
											: 'Crie um pedido novo ou verifique o andamento dos atuais.'}
									</p>
								</div>
								<div className="flex flex-wrap items-center gap-2">
									<Link
										href="/client/orders/new"
										className={getButtonClassName({
											size: 'sm',
											className: 'gap-2 font-black uppercase tracking-widest',
										})}
									>
										<PlusCircle className="w-3 h-3" />
										Novo Pedido
									</Link>
								</div>
							</div>
						}
						emptyState={<ClientOrdersEmptyState />}
						mobileContent={selectedOrders.map((order) => (
							<ClientOrderCard key={order.id} order={order} />
						))}
					>
						<TableHeader>
							<TableRow>
								<TableHead>ID</TableHead>
								<TableHead>Serviço</TableHead>
								<TableHead>Detalhes</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Data</TableHead>
								<TableHead className="text-right">Ação</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{selectedOrders.map((order) => (
								<ClientOrderRow key={order.id} order={order} />
							))}
						</TableBody>
					</DashboardTableSection>
				</div>
			)}
		</DashboardEntrance>
	);
};
