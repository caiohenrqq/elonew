import {
	CheckCircle2,
	PackageCheck,
	PackageOpen,
	Shield,
	XCircle,
} from 'lucide-react';
import { DashboardEmptyState } from '@/shared/dashboard/dashboard-empty-state';
import { DashboardSectionHeader } from '@/shared/dashboard/dashboard-section-header';
import { DashboardSubmitButton } from '@/shared/dashboard/dashboard-submit-button';
import { Badge } from '@/shared/ui/components/badge';
import { Card } from '@/shared/ui/components/card';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/shared/ui/components/table';
import { cn } from '@/shared/ui/utils/cn';
import {
	acceptBoosterOrderAction,
	completeBoosterOrderAction,
	rejectBoosterOrderAction,
} from '../../actions/booster-actions';
import {
	type BoosterOrder,
	formatCurrency,
	formatDate,
	formatOrderRoute,
	formatTitleCase,
} from '../../model/booster-orders';

type BoosterOrderListProps = {
	orders: BoosterOrder[];
	title: string;
	emptyMessage: string;
	mode: 'available' | 'active' | 'completed';
	className?: string;
};

const formatServiceType = (serviceType: string | null) => {
	if (!serviceType) return 'Serviço indisponível';

	return formatTitleCase(serviceType);
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
		);
	}

	return null;
};

export const BoosterOrderList = ({
	orders,
	title,
	emptyMessage,
	mode,
	className,
}: BoosterOrderListProps) => {
	const emptyState = emptyStateByMode[mode];

	return (
		<section
			className={cn('flex min-h-0 flex-1 flex-col space-y-4', className)}
		>
			<DashboardSectionHeader
				title={title}
				detail={orders.length.toString().padStart(2, '0')}
			/>

			<Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
				<div className="grid gap-3 p-3 md:hidden">
					{orders.length === 0 ? (
						<DashboardEmptyState
							icon={emptyState.icon}
							title={emptyState.title}
							description={emptyMessage || emptyState.description}
						/>
					) : (
						orders.map((order) => (
							<article
								key={order.id}
								className="rounded-sm border border-white/10 bg-white/[0.02] p-4"
							>
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
									<Badge variant={order.statusVariant}>
										{order.statusLabel}
									</Badge>
								</div>

								<div className="mt-4 grid grid-cols-2 gap-3 border-white/5 border-t pt-3">
									<div>
										<p className="text-[10px] font-black text-white/35 uppercase tracking-widest">
											Prazo
										</p>
										<p className="mt-1 text-white/60">
											{formatDate(order.deadline)}
										</p>
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

								{mode !== 'completed' ? (
									<div className="mt-4 flex flex-wrap justify-end gap-2">
										<BoosterOrderActions mode={mode} order={order} />
									</div>
								) : null}
							</article>
						))
					)}
				</div>

				<div className="hidden flex-1 overflow-auto [&>div]:h-full md:block">
					<Table className={orders.length === 0 ? 'h-full' : undefined}>
						{orders.length === 0 ? (
							<TableBody className="h-full">
								<TableRow className="h-full hover:bg-transparent">
									<TableCell colSpan={6} className="h-full p-0">
										<DashboardEmptyState
											icon={emptyState.icon}
											title={emptyState.title}
											description={emptyMessage || emptyState.description}
										/>
									</TableCell>
								</TableRow>
							</TableBody>
						) : (
							<>
								<TableHeader>
									<TableRow>
										<TableHead>Serviço</TableHead>
										<TableHead>Rota</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Prazo</TableHead>
										<TableHead>Repasse</TableHead>
										<TableHead className="text-right">Ações</TableHead>
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
														<p className="font-mono text-[10px] text-white/35">
															{order.id}
														</p>
													</div>
												</div>
											</TableCell>
											<TableCell className="font-bold text-white/70">
												{formatOrderRoute(order)}
											</TableCell>
											<TableCell>
												<Badge variant={order.statusVariant}>
													{order.statusLabel}
												</Badge>
											</TableCell>
											<TableCell className="text-white/60">
												{formatDate(order.deadline)}
											</TableCell>
											<TableCell className="font-black text-hextech-gold">
												{formatCurrency(order.boosterAmount)}
											</TableCell>
											<TableCell>
												<div className="flex items-center justify-end gap-2">
													<BoosterOrderActions mode={mode} order={order} />
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</>
						)}
					</Table>
				</div>
			</Card>
		</section>
	);
};
