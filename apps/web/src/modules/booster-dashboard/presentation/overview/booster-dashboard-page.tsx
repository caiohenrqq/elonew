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
			<section className="grid gap-3 md:grid-cols-2">
				<div className="border-b border-white/10 pb-3">
					<p className="text-[10px] font-black uppercase tracking-widest text-white/35">
						Fila
					</p>
					<p className="text-xl font-black text-white">
						{summary.availableOrders.toString().padStart(2, '0')}
					</p>
				</div>
				<div className="border-b border-white/10 pb-3">
					<p className="text-[10px] font-black uppercase tracking-widest text-white/35">
						Estimado
					</p>
					<p className="text-xl font-black text-white">
						{formatCurrency(summary.estimatedAvailableEarnings)}
					</p>
				</div>
			</section>
		);
	}

	return (
		<section className="grid gap-3 md:grid-cols-3">
			<div className="border-b border-white/10 pb-3">
				<p className="text-[10px] font-black uppercase tracking-widest text-white/35">
					Em execução
				</p>
				<p className="text-xl font-black text-white">
					{summary.activeOrders.toString().padStart(2, '0')}
				</p>
			</div>
			<div className="border-b border-white/10 pb-3">
				<p className="text-[10px] font-black uppercase tracking-widest text-white/35">
					Finalizados
				</p>
				<p className="text-xl font-black text-white">
					{summary.completedOrders.toString().padStart(2, '0')}
				</p>
			</div>
			<div className="border-b border-white/10 pb-3">
				<p className="text-[10px] font-black uppercase tracking-widest text-white/35">
					Recebido
				</p>
				<p className="text-xl font-black text-white">
					{formatCurrency(summary.earnedFromRecentCompletions)}
				</p>
			</div>
		</section>
	);
};

const BoosterQueueView = ({ queue }: { queue: BoosterQueueViewModel }) => (
	<>
		<BoosterDashboardSummary tab="queue" summary={queue.summary} />
		<div className="grid gap-8 xl:grid-cols-[1fr_360px]">
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
		<div className="grid gap-8 xl:grid-cols-[1fr_360px]">
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
			<div className="space-y-8">
				<BoosterWorkView
					work={{
						...work,
						wallet,
						transactions: walletTransactions.transactions,
					}}
				/>
			</div>
		);
	}

	const [queueOutput, wallet] = await Promise.all([
		getBoosterQueue(),
		getBoosterWallet(),
	]);
	const queue = toBoosterQueue(queueOutput);

	return (
		<div className="space-y-8">
			<BoosterQueueView queue={{ ...queue, wallet }} />
		</div>
	);
};
