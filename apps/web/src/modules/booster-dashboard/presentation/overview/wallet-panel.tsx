import { Card } from '@packages/ui/components/card';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import {
	formatCurrency,
	formatDate,
	formatTransactionReason,
} from '../../model/booster-orders';
import type {
	BoosterWalletOutput,
	BoosterWalletTransactionsOutput,
} from '../../server/booster-contracts';
import { WithdrawalForm } from './withdrawal-form';

type WalletPanelProps = {
	wallet: BoosterWalletOutput;
	transactions?: BoosterWalletTransactionsOutput['transactions'];
};

export const WalletPanel = ({ wallet, transactions }: WalletPanelProps) => {
	return (
		<aside className="space-y-6">
			<Card className="p-5">
				<div className="mb-5 flex items-center justify-between">
					<h2 className="text-xs font-black uppercase tracking-[0.24em] text-white">
						Carteira
					</h2>
					<p className="font-mono text-[10px] text-white/35">
						{wallet.boosterId}
					</p>
				</div>

				<div className="space-y-4">
					<div>
						<p className="text-[10px] font-black uppercase tracking-widest text-white/35">
							Disponível
						</p>
						<p className="text-2xl font-black text-white">
							{formatCurrency(wallet.balanceWithdrawable)}
						</p>
					</div>
					<div>
						<p className="text-[10px] font-black uppercase tracking-widest text-white/35">
							Bloqueado
						</p>
						<p className="text-lg font-black text-white/70">
							{formatCurrency(wallet.balanceLocked)}
						</p>
					</div>
				</div>

				<div className="mt-6 border-t border-white/5 pt-5">
					<WithdrawalForm maxAmount={wallet.balanceWithdrawable} />
				</div>
			</Card>

			{transactions ? (
				<Card className="p-5">
					<div className="mb-4 flex items-center justify-between">
						<h2 className="text-xs font-black uppercase tracking-[0.24em] text-white">
							Movimentações
						</h2>
						<span className="font-mono text-[10px] text-white/35">
							{transactions.length.toString().padStart(2, '0')}
						</span>
					</div>

					{transactions.length === 0 ? (
						<p className="py-8 text-center text-xs text-white/45">
							Nenhuma movimentação registrada.
						</p>
					) : (
						<div className="divide-y divide-white/5">
							{transactions.map((transaction) => {
								const isCredit = transaction.type === 'credit';
								const Icon = isCredit ? ArrowDownLeft : ArrowUpRight;

								return (
									<div
										key={transaction.id}
										className="flex items-center gap-3 py-3"
									>
										<div className="flex h-8 w-8 items-center justify-center rounded-sm border border-white/5 bg-white/[0.03]">
											<Icon
												className={
													isCredit
														? 'h-4 w-4 text-success'
														: 'h-4 w-4 text-warning'
												}
											/>
										</div>
										<div className="min-w-0 flex-1">
											<p className="truncate text-xs font-bold text-white">
												{formatTransactionReason(transaction.reason)}
											</p>
											<p className="text-[10px] text-white/35">
												{formatDate(transaction.createdAt)}
											</p>
										</div>
										<p className="text-xs font-black text-white">
											{formatCurrency(transaction.amount)}
										</p>
									</div>
								);
							})}
						</div>
					)}
				</Card>
			) : null}
		</aside>
	);
};
