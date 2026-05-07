import { BadgeDollarSign, BriefcaseBusiness, ListChecks } from 'lucide-react';
import { DashboardEntrance } from '@/shared/dashboard/dashboard-entrance';
import { DashboardMetricCard } from '@/shared/dashboard/dashboard-metric-card';
import {
	getBoosterQueue,
	getBoosterWallet,
	getBoosterWalletTransactions,
	getBoosterWork,
} from '../../actions/booster-actions';
import {
	type BoosterQueue,
	type BoosterWork,
	formatCurrency,
	toBoosterQueue,
	toBoosterWork,
} from '../../model/booster-orders';
import {
	type BoosterDashboardTab,
	DEFAULT_BOOSTER_DASHBOARD_TAB,
} from '../../model/booster-tabs';
import type {
	BoosterWalletOutput,
	BoosterWalletTransactionsOutput,
} from '../../server/booster-contracts';
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

type BoosterWorkViewModel = BoosterWork & {
	wallet: BoosterWalletOutput;
	transactions: BoosterWalletTransactionsOutput['transactions'];
};

const BoosterDashboardSummary = ({
	tab,
	summary,
}: BoosterDashboardSummaryProps) => {
	if (tab === 'queue') {
		return (
			<section className="dashboard-animate grid gap-4 md:grid-cols-2">
				<DashboardMetricCard
					icon={ListChecks}
					label="Fila"
					value={summary.availableOrders.toString().padStart(2, '0')}
				>
					<p className="text-[10px] font-bold uppercase tracking-widest text-white/20">
						Pedidos prontos para aceitar
					</p>
				</DashboardMetricCard>
				<DashboardMetricCard
					icon={BadgeDollarSign}
					label="Estimado"
					value={formatCurrency(summary.estimatedAvailableEarnings)}
				>
					<p className="text-[10px] font-bold uppercase tracking-widest text-white/20">
						Repasse potencial da fila
					</p>
				</DashboardMetricCard>
			</section>
		);
	}

	return (
		<section className="dashboard-animate grid gap-4 md:grid-cols-3">
			<DashboardMetricCard
				icon={BriefcaseBusiness}
				label="Em execução"
				value={summary.activeOrders.toString().padStart(2, '0')}
			>
				<p className="text-[10px] font-bold uppercase tracking-widest text-white/20">
					Pedidos sob sua responsabilidade
				</p>
			</DashboardMetricCard>
			<DashboardMetricCard
				icon={ListChecks}
				label="Finalizados"
				value={summary.completedOrders.toString().padStart(2, '0')}
			>
				<p className="text-[10px] font-bold uppercase tracking-widest text-white/20">
					Conclusões recentes
				</p>
			</DashboardMetricCard>
			<DashboardMetricCard
				icon={BadgeDollarSign}
				label="Recebido"
				value={formatCurrency(summary.earnedFromRecentCompletions)}
			>
				<p className="text-[10px] font-bold uppercase tracking-widest text-white/20">
					Repasse dos pedidos finalizados
				</p>
			</DashboardMetricCard>
		</section>
	);
};

const BoosterQueueView = ({ queue }: { queue: BoosterQueueViewModel }) => (
	<>
		<BoosterDashboardSummary tab="queue" summary={queue.summary} />
		<div className="dashboard-animate grid gap-8 xl:grid-cols-[1fr_360px]">
			<BoosterOrderList
				title="Pedidos disponíveis"
				emptyMessage="Nenhum pedido disponível para aceitar agora."
				mode="available"
				orders={queue.availableOrders}
			/>
			<WalletPanel wallet={queue.wallet} />
		</div>
	</>
);

const BoosterWorkView = ({ work }: { work: BoosterWorkViewModel }) => (
	<>
		<BoosterDashboardSummary tab="work" summary={work.summary} />
		<div className="dashboard-animate grid gap-8 xl:grid-cols-[1fr_360px]">
			<div className="space-y-8">
				<BoosterOrderList
					title="Meus pedidos em execução"
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
			<WalletPanel wallet={work.wallet} transactions={work.transactions} />
		</div>
	</>
);

export const BoosterDashboardPage = async ({
	tab = DEFAULT_BOOSTER_DASHBOARD_TAB,
}: BoosterDashboardPageProps = {}) => {
	if (tab === 'work') {
		const [workOutput, wallet, walletTransactions] = await Promise.all([
			getBoosterWork(),
			getBoosterWallet(),
			getBoosterWalletTransactions(),
		]);
		const work = toBoosterWork(workOutput);

		return (
			<DashboardEntrance>
				<BoosterWorkView
					work={{
						...work,
						wallet,
						transactions: walletTransactions.transactions,
					}}
				/>
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
			<BoosterQueueView queue={{ ...queue, wallet }} />
		</DashboardEntrance>
	);
};
