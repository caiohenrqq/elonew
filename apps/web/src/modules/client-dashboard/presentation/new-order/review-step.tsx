import { Badge } from '@packages/ui/components/badge';
import { Button } from '@packages/ui/components/button';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '@packages/ui/components/card';
import { Checkbox } from '@packages/ui/components/checkbox';
import { cn } from '@packages/ui/utils/cn';
import {
	ArrowRight,
	ChevronRight,
	Globe,
	Layers,
	type LucideIcon,
	Shield,
	Users,
	Zap,
} from 'lucide-react';
import { motion } from 'motion/react';
import Image from 'next/image';
import {
	EXTRA_OPTIONS_BY_ID,
	SERVICE_TYPES,
} from '../../model/new-order-options';
import {
	getRankDivisionLabel,
	getRankOption,
	type RankOption,
} from '../../model/rank-options';
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

const DetailItem = ({
	icon: Icon,
	label,
	value,
}: {
	icon: LucideIcon;
	label: string;
	value: string;
}) => (
	<div className="flex flex-col gap-1.5 p-3 rounded-sm bg-white/[0.03] border border-white/5">
		<div className="flex items-center gap-2">
			<Icon className="w-3.5 h-3.5 text-hextech-cyan" />
			<span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
				{label}
			</span>
		</div>
		<p className="text-xs font-black uppercase text-white/90 truncate">
			{value}
		</p>
	</div>
);

const RankDisplay = ({
	rank,
	label,
	division,
	isDesired = false,
}: {
	rank: RankOption;
	label: string;
	division: string;
	isDesired?: boolean;
}) => {
	return (
		<div className="flex flex-col items-center gap-3 flex-1 group">
			<div className="relative cursor-default">
				<div
					className={cn(
						'absolute inset-0 blur-2xl rounded-full pointer-events-none transition-all duration-300 group-hover:opacity-40 group-hover:scale-[1.2]',
						isDesired ? 'opacity-20' : 'opacity-0',
					)}
					style={{ backgroundColor: rank.accent }}
				/>
				<div
					className={cn(
						'relative transition-all duration-300 ease-out group-hover:-translate-y-2 group-hover:scale-105 group-hover:brightness-125 group-hover:drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]',
						isDesired
							? 'drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]'
							: 'drop-shadow-[0_0_0_rgba(255,255,255,0)]',
					)}
				>
					<Image
						src={rank.image}
						alt={rank.label}
						width={80}
						height={80}
						className="relative"
					/>
				</div>
			</div>
			<div className="text-center relative z-10">
				<p
					className={cn(
						'text-[10px] uppercase tracking-widest font-bold mb-0.5',
						isDesired ? 'text-hextech-cyan' : 'text-white/40',
					)}
				>
					{label}
				</p>
				<p className="text-xs font-black uppercase text-white">
					{rank.label} {getRankDivisionLabel(division)}
				</p>
			</div>
		</div>
	);
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
	const currentRank = getRankOption(orderInput.currentLeague);
	const desiredRank = getRankOption(orderInput.desiredLeague);
	const serviceType = SERVICE_TYPES.find(
		(s) => s.id === orderInput.serviceType,
	);

	return (
		<div className="space-y-8">
			<div className="space-y-2">
				<h2 className="text-2xl font-black uppercase tracking-[0.25em] text-white">
					Revisão Final
				</h2>
				<p className="text-white/40 text-xs font-medium">
					Confirme os detalhes do seu pedido antes de prosseguir para o
					pagamento seguro.
				</p>
			</div>

			<Card className="border-hextech-cyan/20 bg-[#0d0d0f]/60 backdrop-blur-sm overflow-hidden">
				<div
					className="absolute inset-0 opacity-10 pointer-events-none"
					style={{
						background: `radial-gradient(circle at 50% 0%, ${desiredRank.accent}, transparent 70%)`,
					}}
				/>

				<CardHeader className="relative border-b border-white/5 pb-4">
					<CardTitle className="flex items-center gap-3 text-sm tracking-widest uppercase">
						<div className="p-1.5 rounded-full bg-hextech-cyan/10">
							<Zap className="w-4 h-4 text-hextech-cyan shadow-[0_0_10px_rgba(14,165,233,0.5)]" />
						</div>
						Resumo do Plano
					</CardTitle>
				</CardHeader>

				<CardContent className="relative p-6 space-y-8">
					<div className="flex items-center justify-between gap-4 py-4 px-2 bg-white/[0.02] rounded-lg border border-white/5 relative overflow-hidden">
						<RankDisplay
							rank={currentRank}
							label="Atual"
							division={orderInput.currentDivision}
						/>

						<div className="flex flex-col items-center justify-center pointer-events-none z-0">
							<ArrowRight className="w-5 h-5 text-white/10" />
						</div>

						<RankDisplay
							rank={desiredRank}
							label="Desejado"
							division={orderInput.desiredDivision}
							isDesired
						/>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
						<DetailItem
							icon={serviceType?.icon === 'shield' ? Shield : Users}
							label="Serviço"
							value={serviceType?.label ?? orderInput.serviceType}
						/>
						<DetailItem
							icon={Globe}
							label="Servidor"
							value={orderInput.server}
						/>
						<DetailItem
							icon={Layers}
							label="Fila"
							value={
								orderInput.desiredQueue === 'solo_duo' ? 'Solo/Duo' : 'Flex'
							}
						/>
					</div>

					<div className="space-y-3">
						<div className="flex items-center gap-2">
							<span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
								Extras Ativos
							</span>
							<div className="h-px flex-1 bg-white/5" />
						</div>
						<div className="flex flex-wrap gap-2">
							{orderInput.extras.map((id) => (
								<Badge
									key={id}
									variant="outline"
									className="bg-white/5 border-white/10 text-[10px] py-1 px-3 uppercase tracking-wider font-bold text-white/70 hover:bg-white/10 transition-colors"
								>
									{EXTRA_OPTIONS_BY_ID.get(id)?.label ?? id}
								</Badge>
							))}
							{orderInput.extras.length === 0 ? (
								<p className="text-[10px] text-white/20 italic font-medium">
									Nenhum extra selecionado para este pedido.
								</p>
							) : null}
						</div>
					</div>
				</CardContent>
			</Card>

			<div className="flex flex-col items-center gap-8 pt-4">
				<div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/[0.02] border border-white/5 w-full">
					<Checkbox
						id="terms-confirmation"
						name="termsConfirmation"
						checked={hasAcceptedTerms}
						onChange={(event) => onTermsChange(event.target.checked)}
						className="shrink-0"
					/>
					<label
						htmlFor="terms-confirmation"
						className="text-[10px] leading-relaxed text-white/40 uppercase tracking-widest cursor-pointer select-none hover:text-white/60 transition-colors"
					>
						Eu concordo plenamente com os{' '}
						<span className="text-hextech-cyan font-bold hover:underline">
							Termos de Serviço
						</span>{' '}
						da EloNew e confirmo que todos os dados acima estão corretos.
					</label>
				</div>

				<div className="flex flex-col sm:flex-row gap-4 w-full">
					<Button
						variant="outline"
						className="flex-1 h-14 border-white/10 hover:bg-white/5 uppercase tracking-[0.2em] text-[10px] font-black"
						onClick={onBack}
					>
						Ajustar Pedido
					</Button>
					<Button
						type="button"
						variant="primary"
						className={cn(
							'flex-[2] h-14 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-[0.2em] text-xs transition-all duration-300 group relative overflow-hidden',
							(isSubmitting || !hasAcceptedTerms) &&
								'opacity-50 grayscale pointer-events-none',
						)}
						onClick={onCheckout}
						disabled={isSubmitting || !hasAcceptedTerms}
					>
						<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
						{isSubmitting ? (
							<span className="flex items-center gap-2">
								<motion.div
									animate={{ rotate: 360 }}
									transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
								>
									<Zap className="w-4 h-4" />
								</motion.div>
								Processando...
							</span>
						) : (
							<span className="flex items-center justify-center gap-2">
								Finalizar e Pagar
								<ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
							</span>
						)}
					</Button>
				</div>

				{error ? (
					<motion.p
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						className="text-[10px] text-red-400 font-black uppercase tracking-widest px-4 py-2 bg-red-400/10 border border-red-400/20 rounded-sm"
					>
						{error}
					</motion.p>
				) : null}
			</div>
		</div>
	);
};
