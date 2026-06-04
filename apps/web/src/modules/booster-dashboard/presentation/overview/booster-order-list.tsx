import {
	CheckCircle2,
	ExternalLink,
	PackageCheck,
	PackageOpen,
	Shield,
	XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { DashboardEmptyState } from '@/shared/dashboard/dashboard-empty-state';
import { DashboardSectionHeader } from '@/shared/dashboard/dashboard-section-header';
import { DashboardSubmitButton } from '@/shared/dashboard/dashboard-submit-button';
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
import {
	acceptBoosterOrderAction,
	completeBoosterOrderAction,
	rejectBoosterOrderAction,
} from '../../actions/booster-actions';
import type { BoosterOrder } from '../../model/booster-orders';

type BoosterOrderListProps = {
	orders: BoosterOrder[];
	title: string;
	emptyMessage: string;
	mode: 'available' | 'active' | 'completed';
	className?: string;
};

const emptyStateByMode = {
	active: {
		description:
			'Pedidos aceitos aparecerão aqui para acompanhamento e finalização.',
		icon: PackageOpen,
		title: 'Nenhum pedido em execução',
	},
	available: {
		description:
			'Quando houver pedidos liberados para boosters, eles aparecerão nesta fila.',
		icon: PackageOpen,
		title: 'Fila vazia',
	},
	completed: {
		description:
			'Pedidos finalizados recentemente aparecerão aqui com o histórico de repasse.',
		icon: PackageCheck,
		title: 'Nenhum finalizado recente',
	},
};

const BoosterOrderActions = ({
	mode,
	order,
}: {
	mode: BoosterOrderListProps['mode'];
	order: BoosterOrder;
}) => {
	if (mode === 'available') {
		return (
			<>
				<form action={acceptBoosterOrderAction.bind(null, order.id)}>
					<DashboardSubmitButton size="sm" pendingLabel="Aceitando">
						<CheckCircle2 className="h-3 w-3" />
						Aceitar
					</DashboardSubmitButton>
				</form>
				<form action={rejectBoosterOrderAction.bind(null, order.id)}>
					<DashboardSubmitButton
						variant="outline"
						size="sm"
						pendingLabel="Recusando"
					>
						<XCircle className="h-3 w-3" />
						Recusar
					</DashboardSubmitButton>
				</form>
			</>
		);
	}

	if (mode === 'active') {
		return (
			<>
				<Link
					href={`/booster/orders/${order.id}`}
					className={getButtonClassName({
						variant: 'primary',
						size: 'sm',
						className: 'gap-2',
					})}
				>
					<ExternalLink className="h-3 w-3" />
					Abrir pedido
				</Link>
				<form action={completeBoosterOrderAction.bind(null, order.id)}>
					<DashboardSubmitButton
						variant="outline"
						size="sm"
						pendingLabel="Finalizando"
					>
						<CheckCircle2 className="h-3 w-3" />
						Finalizar
					</DashboardSubmitButton>
				</form>
			</>
		);
	}

	if (mode === 'completed') {
		return (
			<Link
				href={`/booster/orders/${order.id}`}
				className={getButtonClassName({
					variant: 'outline',
					size: 'sm',
					className: 'gap-2',
				})}
			>
				<ExternalLink className="h-3 w-3" />
				Ver pedido
			</Link>
		);
	}

	return null;
};

const BoosterOrderCard = ({
	order,
	mode,
}: {
	order: BoosterOrder;
	mode: BoosterOrderListProps['mode'];
}) => (
	<article className="rounded-sm border border-white/10 bg-white/[0.02] p-4">
		<div className="flex items-start justify-between gap-3">
			<div className="min-w-0">
				<div className="flex items-center gap-2.5">
					<Shield className="h-4 w-4 shrink-0 text-hextech-cyan/70" />
					<p className="truncate font-black text-sm text-white uppercase tracking-wider">
						{formatServiceType(order.serviceType)}
					</p>
				</div>
				<p className="mt-2 font-bold text-white/75">
					{formatOrderRoute(order)}
				</p>
			</div>
			<OrderStatusBadge status={order.status} />
		</div>

		<div className="mt-4 grid grid-cols-2 gap-3 border-white/5 border-t pt-3">
			<div>
				<p className="text-[10px] font-black text-white/35 uppercase tracking-widest">
					Prazo
				</p>
				<p className="mt-1 text-white/60">{formatDate(order.deadline)}</p>
			</div>
			<div>
				<p className="text-[10px] font-black text-white/35 uppercase tracking-widest">
					Repasse
				</p>
				<p className="mt-1 font-black text-hextech-gold">
					{formatCurrency(order.boosterAmount)}
				</p>
			</div>
		</div>

		<div className="mt-4 flex flex-wrap justify-end gap-2">
			<BoosterOrderActions mode={mode} order={order} />
		</div>
	</article>
);

const BoosterOrderRow = ({
	order,
	mode,
}: {
	order: BoosterOrder;
	mode: BoosterOrderListProps['mode'];
}) => (
	<TableRow>
		<TableCell>
			<div className="flex items-center gap-2.5">
				<Shield className="h-4 w-4 text-hextech-cyan/70 shrink-0" />
				<div className="space-y-1">
					<p className="font-black uppercase tracking-wider text-white leading-tight">
						{formatServiceType(order.serviceType)}
					</p>
					<p className="font-mono text-[10px] text-white/35">{order.id}</p>
				</div>
			</div>
		</TableCell>
		<TableCell className="font-bold text-white/70 whitespace-nowrap">
			{formatOrderRoute(order)}
		</TableCell>
		<TableCell>
			<OrderStatusBadge status={order.status} />
		</TableCell>
		<TableCell className="text-white/60">
			{formatDate(order.deadline)}
		</TableCell>
		<TableCell className="font-black text-hextech-gold">
			{formatCurrency(order.boosterAmount)}
		</TableCell>
		<TableCell className="whitespace-nowrap">
			<div className="flex items-center justify-end gap-2">
				<BoosterOrderActions mode={mode} order={order} />
			</div>
		</TableCell>
	</TableRow>
);

export const BoosterOrderList = ({
	orders,
	title,
	emptyMessage,
	mode,
	className,
}: BoosterOrderListProps) => {
	const emptyState = emptyStateByMode[mode];

	return (
		<DashboardTableSection
			className={className}
			colSpan={6}
			isEmpty={orders.length === 0}
			header={
				<DashboardSectionHeader
					title={title}
					detail={orders.length.toString().padStart(2, '0')}
				/>
			}
			emptyState={
				<DashboardEmptyState
					icon={emptyState.icon}
					title={emptyState.title}
					description={emptyMessage || emptyState.description}
				/>
			}
			mobileContent={orders.map((order) => (
				<BoosterOrderCard key={order.id} order={order} mode={mode} />
			))}
		>
			<TableHeader>
				<TableRow>
					<TableHead>Serviço</TableHead>
					<TableHead className="min-w-44">Rota</TableHead>
					<TableHead>Status</TableHead>
					<TableHead>Prazo</TableHead>
					<TableHead>Repasse</TableHead>
					<TableHead className="min-w-56 text-right">Ações</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{orders.map((order) => (
					<BoosterOrderRow key={order.id} order={order} mode={mode} />
				))}
			</TableBody>
		</DashboardTableSection>
	);
};
