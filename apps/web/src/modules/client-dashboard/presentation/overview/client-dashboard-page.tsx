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
import { Package, PlusCircle } from 'lucide-react';
import Link from 'next/link';
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

const formatOrderDate = (value: string) =>
	new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(value));

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

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<div className="dashboard-animate">
					<DashboardMetricCard
						label="Pedidos Ativos"
						value={formatMetricCount(dashboard.summary.activeOrders)}
					>
						<div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
							<div
								className="h-full bg-hextech-cyan"
								style={{ width: `${activeProgress}%` }}
							/>
						</div>
					</DashboardMetricCard>
				</div>
				<div className="dashboard-animate">
					<DashboardMetricCard
						label="Total Pedidos"
						value={formatMetricCount(dashboard.summary.totalOrders)}
					>
						<p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">
							{dashboard.summary.totalOrders > 0
								? 'Histórico real da sua conta'
								: 'Nenhum pedido ainda'}
						</p>
					</DashboardMetricCard>
				</div>
				<div className="dashboard-animate">
					<DashboardMetricCard
						label="Total Investido"
						value={formatCurrency(dashboard.summary.totalInvested)}
					>
						<p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">
							{dashboard.summary.totalInvested > 0
								? 'Soma dos pedidos finalizados no checkout'
								: 'Nenhum pagamento registrado'}
						</p>
					</DashboardMetricCard>
				</div>
			</div>

			<section className="dashboard-animate space-y-6">
				<div className="flex items-center justify-between">
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
							className:
								'gap-2 tracking-widest font-black uppercase hover:shadow-[0_0_15px_rgba(14,165,233,0.3)] transition-all',
						})}
					>
						<PlusCircle className="w-3 h-3" />
						Novo Pedido
					</Link>
				</div>

				<Card className="overflow-hidden">
					<Table>
						<TableHeader>
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
						<TableBody>
							{dashboard.orders.length > 0 ? (
								dashboard.orders.map((order) => (
									<TableRow key={order.id}>
										<TableCell className="font-mono text-[10px] text-white/60">
											{order.id}
										</TableCell>
										<TableCell className="font-black uppercase tracking-wider text-white">
											{formatServiceType(order.serviceType)}
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
												className="text-[10px] font-black uppercase tracking-widest text-hextech-cyan hover:text-white transition-colors"
											>
												Ver detalhes
											</Link>
										</TableCell>
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell colSpan={6} className="h-40 text-center">
										<div className="flex flex-col items-center justify-center space-y-3 opacity-40">
											<Package className="w-10 h-10" />
											<p className="text-[10px] font-black uppercase tracking-widest">
												Nenhum pedido encontrado
											</p>
											<p className="max-w-sm text-[10px] text-white/50 leading-relaxed">
												Seus pedidos reais aparecerão aqui assim que o histórico
												estiver disponível.
											</p>
										</div>
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</Card>
			</section>
		</DashboardEntrance>
	);
};
