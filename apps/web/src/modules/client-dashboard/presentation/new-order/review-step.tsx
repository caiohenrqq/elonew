import {
	ArrowRight,
	CalendarClock,
	ChevronRight,
	Gamepad2,
	Gauge,
	Globe,
	KeyRound,
	Layers,
	type LucideIcon,
	Shield,
	TrendingUp,
	UserRound,
	Users,
	Zap,
} from 'lucide-react';
import Image from 'next/image';
import { formatDateTime } from '@/shared/format/date';
import { Badge } from '@/shared/ui/components/badge';
import { Button } from '@/shared/ui/components/button';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '@/shared/ui/components/card';
import { Checkbox } from '@/shared/ui/components/checkbox';
import { cn } from '@/shared/ui/utils/cn';
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
import type { AccountInput } from './account-step';

type ReviewStepProps = {
	accountInput: AccountInput;
	favoriteBoosterName: string;
	orderInput: StartCheckoutInput;
	hasAcceptedTerms: boolean;
	onBack: () => void;
	onCheckout: () => void;
	onTermsChange: (hasAcceptedTerms: boolean) => void;
	isSubmitting: boolean;
	error: string | null;
};

const DetailItem = ({
	className,
	icon: Icon,
	label,
	value,
	preserveCase = false,
}: {
	className?: string;
	icon: LucideIcon;
	label: string;
	value: string;
	preserveCase?: boolean;
}) => (
	<div
		className={cn(
			'flex flex-col gap-2 rounded-sm border border-white/10 bg-white/[0.03] p-4',
			className,
		)}
	>
		<div className="flex items-center gap-2">
			<Icon className="h-4 w-4 text-hextech-cyan" aria-hidden="true" />
			<span className="text-xs font-bold uppercase tracking-widest text-white/60">
				{label}
			</span>
		</div>
		<p
			className={cn(
				'break-words text-sm font-black text-white/90',
				preserveCase ? 'normal-case' : 'uppercase',
			)}
		>
			{value}
		</p>
	</div>
);

const maskPassword = (password: string) => '•'.repeat(password.length);

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
		<div className="group flex flex-1 flex-col items-center gap-3">
			<Image
				src={rank.image}
				alt={rank.label}
				width={80}
				height={80}
				className="transition duration-300 ease-out group-hover:-translate-y-1 group-hover:scale-105 group-hover:brightness-110 motion-reduce:transform-none motion-reduce:transition-none"
			/>
			<div className="text-center">
				<p
					className={cn(
						'mb-1 text-xs font-bold uppercase tracking-widest',
						isDesired ? 'text-hextech-cyan' : 'text-white/60',
					)}
				>
					{label}
				</p>
				<p className="text-sm font-black uppercase text-white">
					{rank.label} {getRankDivisionLabel(division)}
				</p>
			</div>
		</div>
	);
};

export const ReviewStep = ({
	accountInput,
	favoriteBoosterName,
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
				<h2 className="text-xl font-black uppercase tracking-[0.2em] text-white">
					Revisão Final
				</h2>
				<p className="text-sm leading-relaxed text-white/65">
					Confirme os detalhes do seu pedido antes de prosseguir para o
					pagamento seguro.
				</p>
			</div>

			<Card className="overflow-hidden border-white/10 bg-surface">
				<CardHeader className="border-b border-white/10 pb-4">
					<CardTitle className="flex items-center gap-3 text-sm tracking-widest uppercase">
						<Zap className="h-4 w-4 text-hextech-cyan" aria-hidden="true" />
						Resumo do Plano
					</CardTitle>
				</CardHeader>

				<CardContent className="space-y-8 p-4 sm:p-6">
					<div className="flex items-center justify-between gap-4 rounded-sm border border-white/10 bg-white/[0.02] px-2 py-4">
						<RankDisplay
							rank={currentRank}
							label="Atual"
							division={orderInput.currentDivision}
						/>

						<div className="pointer-events-none flex flex-col items-center justify-center">
							<ArrowRight
								className="h-5 w-5 text-white/40"
								aria-hidden="true"
							/>
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

					<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
						<DetailItem
							icon={Gauge}
							label="PDL atual"
							value={`${orderInput.currentLp} PDL`}
						/>
						<DetailItem
							icon={TrendingUp}
							label="Ganho por vitória"
							value={`${orderInput.lpGain} PDL`}
						/>
						<DetailItem
							className={favoriteBoosterName ? undefined : 'sm:col-span-2'}
							icon={CalendarClock}
							label="Prazo"
							value={formatDateTime(orderInput.deadline)}
							preserveCase
						/>
						{favoriteBoosterName ? (
							<DetailItem
								icon={UserRound}
								label="Booster favorito"
								value={favoriteBoosterName}
								preserveCase
							/>
						) : null}
					</div>

					<div className="space-y-3">
						<div className="flex items-center gap-2">
							<span className="text-xs font-bold uppercase tracking-widest text-white/60">
								Dados da Conta
							</span>
							<div className="h-px flex-1 bg-white/5" />
						</div>
						<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
							<DetailItem
								icon={UserRound}
								label="Login"
								value={accountInput.login}
								preserveCase
							/>
							<DetailItem
								icon={Gamepad2}
								label="Nome de invocador"
								value={accountInput.summonerName}
								preserveCase
							/>
							<DetailItem
								className="sm:col-span-2"
								icon={KeyRound}
								label="Senha"
								value={maskPassword(accountInput.password)}
								preserveCase
							/>
						</div>
					</div>

					<div className="space-y-3">
						<div className="flex items-center gap-2">
							<span className="text-xs font-bold uppercase tracking-widest text-white/60">
								Extras Ativos
							</span>
							<div className="h-px flex-1 bg-white/5" />
						</div>
						<div className="flex flex-wrap gap-2">
							{orderInput.extras.map((id) => (
								<Badge
									key={id}
									variant="outline"
									className="border-white/10 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white/75"
								>
									{EXTRA_OPTIONS_BY_ID.get(id)?.label ?? id}
								</Badge>
							))}
							{orderInput.extras.length === 0 ? (
								<p className="text-sm text-white/60">
									Nenhum extra selecionado para este pedido.
								</p>
							) : null}
						</div>
					</div>
				</CardContent>
			</Card>

			<div className="flex flex-col items-center gap-6 pt-4">
				<div className="flex w-full items-start gap-3 rounded-sm border border-white/10 bg-white/[0.02] px-4 py-4">
					<Checkbox
						id="terms-confirmation"
						name="termsConfirmation"
						checked={hasAcceptedTerms}
						onChange={(event) => onTermsChange(event.target.checked)}
						className="mt-0.5 h-5 w-5 shrink-0"
					/>
					<label
						htmlFor="terms-confirmation"
						className="cursor-pointer select-none text-sm leading-relaxed text-white/70"
					>
						Eu concordo com os Termos de Serviço da EloNew e confirmo que todos
						os dados acima estão corretos.
					</label>
				</div>

				<div className="flex w-full flex-col gap-3 sm:flex-row">
					<Button
						variant="outline"
						className="h-14 flex-1 border-white/10 text-xs"
						onClick={onBack}
					>
						Ajustar Pedido
					</Button>
					<Button
						type="button"
						variant="primary"
						className="h-14 flex-[2] text-xs"
						onClick={onCheckout}
						disabled={isSubmitting || !hasAcceptedTerms}
					>
						{isSubmitting ? (
							<span className="flex items-center gap-2">
								<Zap className="h-4 w-4" aria-hidden="true" />
								Processando...
							</span>
						) : (
							<span className="flex items-center justify-center gap-2">
								Finalizar e Pagar
								<ChevronRight className="h-5 w-5" aria-hidden="true" />
							</span>
						)}
					</Button>
				</div>

				{error ? (
					<p
						className="w-full rounded-sm border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm font-medium text-red-300"
						role="alert"
					>
						{error}
					</p>
				) : null}
			</div>
		</div>
	);
};
