import { Badge } from '@packages/ui/components/badge';
import { Button } from '@packages/ui/components/button';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '@packages/ui/components/card';
import { Checkbox } from '@packages/ui/components/checkbox';
import { ChevronRight, Zap } from 'lucide-react';
import {
	EXTRAS,
	getDivisionLabel,
	getLeagueLabel,
} from '../../model/new-order-options';
import type { StartCheckoutInput } from '../../server/order-contracts';

type ReviewStepProps = {
	orderInput: StartCheckoutInput;
	hasAcceptedTerms: boolean;
	onBack: () => void;
	onCheckout: () => void;
	onTermsChange: (hasAcceptedTerms: boolean) => void;
	isSubmitting: boolean;
	error: string | null;
};

export const ReviewStep = ({
	orderInput,
	hasAcceptedTerms,
	onBack,
	onCheckout,
	onTermsChange,
	isSubmitting,
	error,
}: ReviewStepProps) => {
	return (
		<div className="space-y-8">
			<div className="space-y-2">
				<h2 className="text-xl font-black uppercase tracking-[0.2em]">
					Revisão Final
				</h2>
				<p className="text-white/40 text-xs">
					Confira todos os dados antes de prosseguir para o pagamento.
				</p>
			</div>

			<Card className="border-hextech-cyan/20">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Zap className="w-4 h-4 text-hextech-cyan" />
						Resumo do Plano
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex justify-between items-end border-b border-white/5 pb-4">
						<div>
							<p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">
								Serviço
							</p>
							<p className="text-xs font-black uppercase text-hextech-cyan">
								{orderInput.serviceType.replace('_', ' ')}
							</p>
						</div>
						<div className="text-right">
							<p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">
								Trajeto
							</p>
							<p className="text-xs font-black uppercase">
								{getLeagueLabel(orderInput.currentLeague)}{' '}
								{getDivisionLabel(orderInput.currentDivision)} {'->'}{' '}
								{getLeagueLabel(orderInput.desiredLeague)}{' '}
								{getDivisionLabel(orderInput.desiredDivision)}
							</p>
						</div>
					</div>
					<div className="space-y-2">
						<p className="text-[10px] text-white/40 uppercase tracking-widest">
							Extras Ativos
						</p>
						<div className="flex flex-wrap gap-2">
							{orderInput.extras.map((id) => (
								<Badge key={id} variant="outline" className="bg-white/5">
									{EXTRAS.find((extra) => extra.id === id)?.label}
								</Badge>
							))}
							{orderInput.extras.length === 0 ? (
								<span className="text-[10px] text-white/20 italic">
									Nenhum extra selecionado
								</span>
							) : null}
						</div>
					</div>
				</CardContent>
			</Card>

			<div className="flex flex-col items-center gap-6 pt-6 border-t border-white/5 mt-8">
				<div className="flex items-center gap-2 px-2">
					<Checkbox
						id="terms-confirmation"
						name="termsConfirmation"
						checked={hasAcceptedTerms}
						onChange={(event) => onTermsChange(event.target.checked)}
					/>
					<label
						htmlFor="terms-confirmation"
						className="text-[9px] text-white/40 uppercase tracking-widest cursor-pointer select-none hover:text-white/60 transition-colors"
					>
						Eu concordo com os{' '}
						<span className="text-white underline">Termos de Serviço</span> e
						confirmo que meus dados estão corretos.
					</label>
				</div>
				<div className="flex gap-4 w-full">
					<Button variant="outline" className="flex-1" onClick={onBack}>
						Ajustar
					</Button>
					<Button
						type="button"
						variant="primary"
						className="flex-[2] bg-emerald-500 hover:bg-emerald-600 group"
						onClick={onCheckout}
						disabled={isSubmitting}
					>
						{isSubmitting ? 'Iniciando checkout...' : 'Finalizar e Pagar'}
						{!isSubmitting && (
							<ChevronRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
						)}
					</Button>
				</div>
				{error ? (
					<p className="text-[10px] text-red-400 uppercase tracking-widest">
						{error}
					</p>
				) : null}
			</div>
		</div>
	);
};
