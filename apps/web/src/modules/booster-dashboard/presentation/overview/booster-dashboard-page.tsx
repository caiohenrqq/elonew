import { BadgeDollarSign, BriefcaseBusiness, ListChecks } from 'lucide-react';
import { DashboardEntrance } from '@/shared/dashboard/dashboard-entrance';
import { DashboardMetricCard } from '@/shared/dashboard/dashboard-metric-card';
import { formatCurrency } from '@/shared/format/currency';
import {
	getBoosterQueue,
	getBoosterWallet,
	getBoosterWork,
} from '../../actions/booster-actions';
import {
	type BoosterQueue,
	type BoosterWork,
	toBoosterQueue,
	toBoosterWork,
} from '../../model/booster-orders';
import {
	type BoosterDashboardTab,
	DEFAULT_BOOSTER_DASHBOARD_TAB,
} from '../../model/booster-tabs';
import type { BoosterWalletOutput } from '../../server/booster-contracts';
import { BoosterDashboardLiveRefresh } from './booster-dashboard-live-refresh';
import { BoosterOrderList } from './booster-order-list';
import { WalletPanel } from './wallet-panel';

type BoosterDashboardPageProps = {
	tab?: BoosterDashboardTab;
};

type BoosterDashboardSummaryProps =
	| {
			tab: 'queue';
			summary: BoosterQueue['summary'];
	  }
	| {
			tab: 'work';
			summary: BoosterWork['summary'];
	  };

type BoosterQueueViewModel = BoosterQueue & {
	wallet: BoosterWalletOutput;
};

const BoosterDashboardSummary = ({
	tab,
	summary,
}: BoosterDashboardSummaryProps) => {
	if (tab === 'queue') {
		return (
			<section className="dashboard-animate flex-none grid gap-6 md:grid-cols-2">
				<DashboardMetricCard
					icon={ListChecks}
					label="Fila"
					value={summary.availableOrders.toString().padStart(2, '0')}
				>
					<p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
						Pedidos prontos para aceitar
					</p>
				</DashboardMetricCard>
				<DashboardMetricCard
					icon={BadgeDollarSign}
					label="Estimado"
					value={formatCurrency(summary.estimatedAvailableEarnings)}
				>
					<p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
						Repasse potencial da fila
					</p>
				</DashboardMetricCard>
			</section>
		);
	}

	return (
		<section className="dashboard-animate flex-none grid gap-6 md:grid-cols-3">
			<DashboardMetricCard
				icon={BriefcaseBusiness}
				label="Em execução"
				value={summary.activeOrders.toString().padStart(2, '0')}
			>
				<p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
					Pedidos sob sua responsabilidade
				</p>
			</DashboardMetricCard>
			<DashboardMetricCard
				icon={ListChecks}
				label="Finalizados"
				value={summary.completedOrders.toString().padStart(2, '0')}
			>
				<p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
					Conclusões recentes
				</p>
			</DashboardMetricCard>
			<DashboardMetricCard
				icon={BadgeDollarSign}
				label="Recebido"
				value={formatCurrency(summary.earnedFromRecentCompletions)}
			>
				<p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
					Repasse dos pedidos finalizados
				</p>
			</DashboardMetricCard>
		</section>
	);
};

const BoosterQueueView = ({ queue }: { queue: BoosterQueueViewModel }) => (
	<div className="flex flex-1 flex-col space-y-10 min-h-0">
		<BoosterDashboardSummary tab="queue" summary={queue.summary} />
		<div className="dashboard-animate flex min-h-0 flex-1 flex-col gap-6 xl:grid xl:grid-cols-[1fr_360px]">
			<BoosterOrderList
				title="Pedidos disponíveis"
				emptyMessage="Nenhum pedido pago disponível para aceitar agora."
				mode="available"
				orders={queue.availableOrders}
			/>
			<WalletPanel wallet={queue.wallet} />
		</div>
	</div>
);

const BoosterWorkView = ({ work }: { work: BoosterWork }) => (
	<div className="flex flex-1 flex-col space-y-10 min-h-0">
		<BoosterDashboardSummary tab="work" summary={work.summary} />
		<div className="dashboard-animate flex min-h-0 flex-1 flex-col space-y-8">
			<BoosterOrderList
				title="Pedidos em execução"
				emptyMessage="Nenhum pedido em execução."
				mode="active"
				orders={work.activeOrders}
			/>
			<BoosterOrderList
				title="Finalizados recentes"
				emptyMessage="Nenhum pedido finalizado recentemente."
				mode="completed"
				orders={work.recentCompletedOrders}
			/>
		</div>
	</div>
);

export const BoosterDashboardPage = async ({
	tab = DEFAULT_BOOSTER_DASHBOARD_TAB,
}: BoosterDashboardPageProps = {}) => {
	if (tab === 'work') {
		const workOutput = await getBoosterWork();
		const work = toBoosterWork(workOutput);

		return (
			<DashboardEntrance>
				<BoosterDashboardLiveRefresh />
				<BoosterWorkView work={work} />
			</DashboardEntrance>
		);
	}

	const [queueOutput, wallet] = await Promise.all([
		getBoosterQueue(),
		getBoosterWallet(),
	]);
	const queue = toBoosterQueue(queueOutput);

	return (
		<DashboardEntrance>
			<BoosterDashboardLiveRefresh />
			<BoosterQueueView queue={{ ...queue, wallet }} />
		</DashboardEntrance>
	);
};
