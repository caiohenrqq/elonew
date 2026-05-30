import type {
	BoosterOrderOutput,
	BoosterQueueOutput,
	BoosterWalletTransactionOutput,
	BoosterWorkOutput,
} from '../server/booster-contracts';

export type BoosterOrder = BoosterOrderOutput;

export type BoosterQueue = BoosterQueueOutput;

export type BoosterWork = BoosterWorkOutput;

export const toBoosterQueue = (queue: BoosterQueueOutput): BoosterQueue =>
	queue;

export const toBoosterWork = (work: BoosterWorkOutput): BoosterWork => work;

export const formatTransactionReason = (
	reason: BoosterWalletTransactionOutput['reason'],
) => {
	if (reason === 'order_completion') return 'Conclusão de pedido';
	return 'Solicitação de saque';
};
