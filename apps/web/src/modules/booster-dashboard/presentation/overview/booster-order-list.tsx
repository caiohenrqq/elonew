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
import { CheckCircle2, PackageCheck, PackageOpen, XCircle } from 'lucide-react';
import { DashboardEmptyState } from '@/shared/dashboard/dashboard-empty-state';
import { DashboardSectionHeader } from '@/shared/dashboard/dashboard-section-header';
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

export const BoosterOrderList = ({
	orders,
	title,
	emptyMessage,
	mode,
}: BoosterOrderListProps) => {
	const emptyState = emptyStateByMode[mode];

	return (
		<section className="space-y-4">
			<DashboardSectionHeader
				title={title}
				detail={orders.length.toString().padStart(2, '0')}
			/>

			<Card className="overflow-hidden">
				{orders.length === 0 ? (
					<DashboardEmptyState
						icon={emptyState.icon}
						title={emptyState.title}
						description={emptyMessage || emptyState.description}
					/>
				) : (
					<Table>
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
										<div className="space-y-1">
											<p className="font-black uppercase tracking-wider text-white">
												{formatServiceType(order.serviceType)}
											</p>
											<p className="font-mono text-[10px] text-white/35">
												{order.id}
											</p>
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
											{mode === 'available' ? (
												<>
													<form
														action={acceptBoosterOrderAction.bind(
															null,
															order.id,
														)}
													>
														<button
															type="submit"
															className={getButtonClassName({
																size: 'sm',
																className: 'gap-2',
															})}
														>
															<CheckCircle2 className="h-3 w-3" />
															Aceitar
														</button>
													</form>
													<form
														action={rejectBoosterOrderAction.bind(
															null,
															order.id,
														)}
													>
														<button
															type="submit"
															className={getButtonClassName({
																variant: 'outline',
																size: 'sm',
																className: 'gap-2',
															})}
														>
															<XCircle className="h-3 w-3" />
															Recusar
														</button>
													</form>
												</>
											) : null}

											{mode === 'active' ? (
												<form
													action={completeBoosterOrderAction.bind(
														null,
														order.id,
													)}
												>
													<button
														type="submit"
														className={getButtonClassName({
															variant: 'outline',
															size: 'sm',
															className: 'gap-2',
														})}
													>
														<CheckCircle2 className="h-3 w-3" />
														Finalizar
													</button>
												</form>
											) : null}
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</Card>
		</section>
	);
};
