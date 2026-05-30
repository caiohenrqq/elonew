import {
	Activity,
	ArrowRight,
	Coins,
	Package,
	PlusCircle,
	Shield,
} from 'lucide-react';
import Link from 'next/link';
import { DashboardEmptyState } from '@/shared/dashboard/dashboard-empty-state';
import { DashboardEntrance } from '@/shared/dashboard/dashboard-entrance';
import { DashboardMetricCard } from '@/shared/dashboard/dashboard-metric-card';
import { DashboardTableSection } from '@/shared/dashboard/dashboard-table-section';
import { formatCurrency } from '@/shared/format/currency';
import { formatDate } from '@/shared/format/date';
import { formatOrderRoute, formatServiceType } from '@/shared/format/orders';
import { getButtonClassName } from '@/shared/ui/components/button';
import { OrderStatusBadge } from '@/shared/ui/components/status-badge';
import {
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/shared/ui/components/table';
import type { ClientDashboard, ClientDashboardOrder } from '../../model/orders';
import { ClientDashboardLiveRefresh } from './client-dashboard-live-refresh';
import { DevelopmentCheckoutModal } from './development-checkout-modal';

type ClientDashboardPageProps = {
	dashboard: ClientDashboard;
	devPaymentId?: string;
};

const formatMetricCount = (value: number) => value.toString().padStart(2, '0');

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
				<p className="mt-2 font-bold text-white/80">
					{formatOrderRoute(order)}
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
				<p className="font-bold text-white/80">{formatOrderRoute(order)}</p>
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
					variant: 'outline',
					size: 'sm',
					className: 'gap-2 font-black uppercase tracking-widest',
				})}
			>
				Detalhes
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

export const ClientDashboardPage = ({
	dashboard,
	devPaymentId,
}: ClientDashboardPageProps) => {
	const activeProgress =
		dashboard.summary.totalOrders > 0
			? (dashboard.summary.activeOrders / dashboard.summary.totalOrders) * 100
			: 0;

	return (
		<DashboardEntrance>
			<ClientDashboardLiveRefresh />
			{devPaymentId ? (
				<DevelopmentCheckoutModal devPaymentId={devPaymentId} />
			) : null}

			<div className="grid flex-none grid-cols-1 gap-6 md:grid-cols-3">
				<div className="dashboard-animate h-full">
					<DashboardMetricCard
						label="Pedidos Ativos"
						value={formatMetricCount(dashboard.summary.activeOrders)}
						icon={Activity}
					>
						<div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
							<div
								className="h-full bg-hextech-cyan"
								style={{ width: `${activeProgress}%` }}
							/>
						</div>
					</DashboardMetricCard>
				</div>
				<div className="dashboard-animate h-full">
					<DashboardMetricCard
						label="Total Pedidos"
						value={formatMetricCount(dashboard.summary.totalOrders)}
						icon={Package}
					>
						<p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
							{dashboard.summary.totalOrders > 0
								? 'Histórico real da sua conta'
								: 'Nenhum pedido ainda'}
						</p>
					</DashboardMetricCard>
				</div>
				<div className="dashboard-animate h-full">
					<DashboardMetricCard
						label="Total Investido"
						value={formatCurrency(dashboard.summary.totalInvested)}
						icon={Coins}
					>
						<p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
							{dashboard.summary.totalInvested > 0
								? 'Soma dos pedidos finalizados no checkout'
								: 'Nenhum pagamento registrado'}
						</p>
					</DashboardMetricCard>
				</div>
			</div>

			<DashboardTableSection
				className="space-y-6"
				colSpan={6}
				isEmpty={dashboard.orders.length === 0}
				scrollAreaTestId="client-orders-table-scroll-area"
				header={
					<div className="flex flex-none items-center justify-between">
						<div className="space-y-1">
							<h2 className="text-xs font-black uppercase tracking-[0.3em] text-white">
								Pedidos Recentes
							</h2>
							<p className="text-[10px] text-white/40 tracking-wider">
								Acompanhe o status dos seus serviços contratados.
							</p>
						</div>
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
				}
				emptyState={<ClientOrdersEmptyState />}
				mobileContent={dashboard.orders.map((order) => (
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
						<TableHead className="text-right">Ações</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{dashboard.orders.map((order) => (
						<ClientOrderRow key={order.id} order={order} />
					))}
				</TableBody>
			</DashboardTableSection>
		</DashboardEntrance>
	);
};
