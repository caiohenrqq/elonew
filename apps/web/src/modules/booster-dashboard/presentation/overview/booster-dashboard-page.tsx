import { BadgeDollarSign, BriefcaseBusiness, ListChecks } from 'lucide-react';
import type { ChatMessage } from '@/shared/chat/chat.types';
import { DashboardEntrance } from '@/shared/dashboard/dashboard-entrance';
import { DashboardMetricCard } from '@/shared/dashboard/dashboard-metric-card';
import { formatCurrency } from '@/shared/format/currency';
import { formatOrderRoute } from '@/shared/format/orders';
import {
	getBoosterOrderChatMessages,
	getBoosterQueue,
	getBoosterUserId,
	getBoosterWallet,
	getBoosterWalletTransactions,
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
import type {
	BoosterWalletOutput,
	BoosterWalletTransactionsOutput,
} from '../../server/booster-contracts';
import { BoosterChatPanel } from './booster-chat-panel';
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

type BoosterWorkViewModel = BoosterWork & {
	wallet: BoosterWalletOutput;
	transactions: BoosterWalletTransactionsOutput['transactions'];
	currentUserId: string;
	chatMessagesByOrderId: Record<string, ChatMessage[]>;
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

const BoosterWorkView = ({ work }: { work: BoosterWorkViewModel }) => (
	<div className="flex flex-1 flex-col space-y-10 min-h-0">
		<BoosterDashboardSummary tab="work" summary={work.summary} />
		<div className="dashboard-animate flex min-h-0 flex-1 flex-col gap-6 xl:grid xl:grid-cols-[1fr_360px]">
			<div className="flex min-h-0 flex-1 flex-col space-y-8">
				<BoosterOrderList
					title="Meus pedidos em execução"
					emptyMessage="Nenhum pedido em execução."
					mode="active"
					orders={work.activeOrders}
				/>
				{work.activeOrders.length > 0 ? (
					<section className="flex-none space-y-4">
						<div>
							<p className="text-[10px] font-black uppercase tracking-[0.2em] text-hextech-cyan">
								Chat interno
							</p>
							<h2 className="font-display text-2xl font-black text-white">
								Conversas ativas
							</h2>
						</div>
						<div className="grid gap-4 lg:grid-cols-2">
							{work.activeOrders.map((order) => (
								<BoosterChatPanel
									key={order.id}
									orderId={order.id}
									orderLabel={formatOrderRoute(order)}
									currentUserId={work.currentUserId}
									initialMessages={work.chatMessagesByOrderId[order.id] ?? []}
								/>
							))}
						</div>
					</section>
				) : null}
				<BoosterOrderList
					title="Finalizados recentes"
					emptyMessage="Nenhum pedido finalizado recentemente."
					mode="completed"
					orders={work.recentCompletedOrders}
				/>
			</div>
			<WalletPanel wallet={work.wallet} transactions={work.transactions} />
		</div>
	</div>
);

export const BoosterDashboardPage = async ({
	tab = DEFAULT_BOOSTER_DASHBOARD_TAB,
}: BoosterDashboardPageProps = {}) => {
	if (tab === 'work') {
		const [workOutput, wallet, walletTransactions, currentUserId] =
			await Promise.all([
				getBoosterWork(),
				getBoosterWallet(),
				getBoosterWalletTransactions(),
				getBoosterUserId(),
			]);
		const work = toBoosterWork(workOutput);
		const chatEntries = await Promise.all(
			work.activeOrders.map(async (order) => {
				const chat = await getBoosterOrderChatMessages(order.id);
				return [order.id, chat.items] as const;
			}),
		);

		return (
			<DashboardEntrance>
				<BoosterDashboardLiveRefresh />
				<BoosterWorkView
					work={{
						...work,
						wallet,
						transactions: walletTransactions.transactions,
						currentUserId,
						chatMessagesByOrderId: Object.fromEntries(chatEntries),
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
			<BoosterDashboardLiveRefresh />
			<BoosterQueueView queue={{ ...queue, wallet }} />
		</DashboardEntrance>
	);
};
