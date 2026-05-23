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
import type { ClientDashboardOrder } from '../../model/orders';
import { type ClientDashboard, formatCurrency } from '../../model/orders';
import { ClientDashboardLiveRefresh } from './client-dashboard-live-refresh';
import { DevelopmentCheckoutModal } from './development-checkout-modal';

type ClientDashboardPageProps = {
	dashboard: ClientDashboard;
	devPaymentId?: string;
};

const formatMetricCount = (value: number) => value.toString().padStart(2, '0');

const orderDateFormatter = new Intl.DateTimeFormat('pt-BR', {
	timeZone: 'UTC',
});

const formatOrderDate = (value: string) =>
	orderDateFormatter.format(new Date(value));

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

const formatOrderRoute = (order: ClientDashboardOrder) => {
	if (
		!order.currentLeague ||
		!order.currentDivision ||
		!order.desiredLeague ||
		!order.desiredDivision
	)
		return 'Detalhes indisponíveis';

	return `${formatTitleCase(order.currentLeague)} ${order.currentDivision} → ${formatTitleCase(order.desiredLeague)} ${order.desiredDivision}`;
};

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

			<section className="dashboard-animate flex min-h-0 flex-1 flex-col space-y-6">
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

				<Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
					<div className="grid gap-3 p-3 md:hidden">
						{dashboard.orders.length > 0 ? (
							dashboard.orders.map((order) => (
								<Link
									key={order.id}
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
										<Badge variant={order.statusVariant}>
											{order.statusLabel}
										</Badge>
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
											<p className="mt-1 text-white/60">
												{formatOrderDate(order.createdAt)}
											</p>
										</div>
									</div>
								</Link>
							))
						) : (
							<DashboardEmptyState
								icon={Package}
								title="Nenhum pedido encontrado"
								description="Crie seu primeiro pedido para acompanhar status, pagamento e progresso por aqui."
								action={
									<Link
										href="/client/orders/new"
										className={getButtonClassName({
											size: 'sm',
											className: 'gap-2',
										})}
									>
										<PlusCircle className="h-3 w-3" />
										Novo Pedido
									</Link>
								}
							/>
						)}
					</div>

					<div
						data-testid="client-orders-table-scroll-area"
						className="hidden flex-1 overflow-auto [&>div]:h-full md:block"
					>
						<Table
							className={dashboard.orders.length === 0 ? 'h-full' : undefined}
							wrapperClassName={
								dashboard.orders.length === 0 ? 'overflow-hidden' : undefined
							}
						>
							<TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur">
								<TableRow>
									<TableHead className="text-[10px] uppercase font-black tracking-widest">
										ID
									</TableHead>
									<TableHead className="text-[10px] uppercase font-black tracking-widest">
										Serviço
									</TableHead>
									<TableHead className="text-[10px] uppercase font-black tracking-widest">
										Detalhes
									</TableHead>
									<TableHead className="text-[10px] uppercase font-black tracking-widest">
										Status
									</TableHead>
									<TableHead className="text-[10px] uppercase font-black tracking-widest">
										Data
									</TableHead>
									<TableHead className="text-[10px] uppercase font-black tracking-widest text-right">
										Ações
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody
								className={dashboard.orders.length === 0 ? 'h-full' : undefined}
							>
								{dashboard.orders.length > 0 ? (
									dashboard.orders.map((order) => (
										<TableRow key={order.id}>
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
													<p className="font-bold text-white/80">
														{formatOrderRoute(order)}
													</p>
													<p className="text-[10px] uppercase tracking-widest text-white/35">
														{formatCurrency(order.totalAmount)}
													</p>
												</div>
											</TableCell>
											<TableCell>
												<Badge variant={order.statusVariant}>
													{order.statusLabel}
												</Badge>
											</TableCell>
											<TableCell className="text-white/50">
												{formatOrderDate(order.createdAt)}
											</TableCell>
											<TableCell className="text-right">
												<Link
													href={`/client/orders/${order.id}`}
													className={getButtonClassName({
														variant: 'outline',
														size: 'sm',
														className:
															'gap-2 font-black uppercase tracking-widest',
													})}
												>
													Detalhes
													<ArrowRight className="w-3 h-3" />
												</Link>
											</TableCell>
										</TableRow>
									))
								) : (
									<TableRow className="h-full hover:bg-transparent">
										<TableCell colSpan={6} className="h-full p-0 text-center">
											<DashboardEmptyState
												icon={Package}
												title="Nenhum pedido encontrado"
												description="Crie seu primeiro pedido para acompanhar status, pagamento e progresso por aqui."
												action={
													<Link
														href="/client/orders/new"
														className={getButtonClassName({
															size: 'sm',
															className: 'gap-2',
														})}
													>
														<PlusCircle className="h-3 w-3" />
														Novo Pedido
													</Link>
												}
											/>
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>
				</Card>
			</section>
		</DashboardEntrance>
	);
};
