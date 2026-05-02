import { Badge } from '@packages/ui/components/badge';
import { getButtonClassName } from '@packages/ui/components/button';
import { Card } from '@packages/ui/components/card';
import { CheckCircle2, XCircle } from 'lucide-react';
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

export const BoosterOrderList = ({
	orders,
	title,
	emptyMessage,
	mode,
}: BoosterOrderListProps) => {
	return (
		<section className="space-y-4">
			<div className="flex items-center justify-between">
				<h2 className="text-xs font-black uppercase tracking-[0.24em] text-white">
					{title}
				</h2>
				<span className="font-mono text-[10px] text-white/35">
					{orders.length.toString().padStart(2, '0')}
				</span>
			</div>

			<Card className="overflow-hidden">
				{orders.length === 0 ? (
					<div className="p-8 text-center text-xs text-white/45">
						{emptyMessage}
					</div>
				) : (
					<div className="divide-y divide-white/5">
						{orders.map((order) => (
							<div
								key={order.id}
								className="grid gap-4 p-4 lg:grid-cols-[1.3fr_0.8fr_0.8fr_auto] lg:items-center"
							>
								<div className="min-w-0 space-y-1">
									<div className="flex flex-wrap items-center gap-2">
										<p className="font-black uppercase tracking-wider text-white">
											{formatServiceType(order.serviceType)}
										</p>
										<Badge variant={order.statusVariant}>
											{order.statusLabel}
										</Badge>
									</div>
									<p className="text-xs font-bold text-white/70">
										{formatOrderRoute(order)}
									</p>
									<p className="font-mono text-[10px] text-white/35">
										{order.id}
									</p>
								</div>

								<div className="text-xs text-white/60">
									<p className="font-black uppercase tracking-widest text-white/35">
										Prazo
									</p>
									<p>{formatDate(order.deadline)}</p>
								</div>

								<div className="text-xs text-white/60">
									<p className="font-black uppercase tracking-widest text-white/35">
										Repasse
									</p>
									<p className="text-white">
										{formatCurrency(order.boosterAmount)}
									</p>
								</div>

								{mode === 'available' ? (
									<div className="flex items-center gap-2 lg:justify-end">
										<form
											action={acceptBoosterOrderAction.bind(null, order.id)}
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
											action={rejectBoosterOrderAction.bind(null, order.id)}
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
									</div>
								) : null}

								{mode === 'active' ? (
									<div className="flex lg:justify-end">
										<form
											action={completeBoosterOrderAction.bind(null, order.id)}
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
									</div>
								) : null}
							</div>
						))}
					</div>
				)}
			</Card>
		</section>
	);
};
