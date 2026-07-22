import type { OrderExtraType } from '@packages/shared/orders/order-extra';
import { CheckCircle2, ChevronRight } from 'lucide-react';
import { type MouseEvent, useRef } from 'react';
import { gsap, useGSAP } from '@/shared/ui/animation/gsap';
import { Badge } from '@/shared/ui/components/badge';
import { Button } from '@/shared/ui/components/button';
import { Input } from '@/shared/ui/components/input';
import { Label } from '@/shared/ui/components/label';
import { NumberInput } from '@/shared/ui/components/number-input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/shared/ui/components/select';
import { SelectableOption } from '@/shared/ui/components/selectable-option';
import { cn } from '@/shared/ui/utils/cn';
import { EXTRAS, QUEUES, SERVERS } from '../../model/new-order-options';
import type { StartCheckoutInput } from '../../server/order-contracts';

type DetailsStepProps = {
	favoriteBoosterName?: string;
	orderInput: StartCheckoutInput;
	onBack: () => void;
	onNext: () => void;
	onChange: <Key extends keyof StartCheckoutInput>(
		key: Key,
		value: StartCheckoutInput[Key],
	) => void;
	onToggleExtra: (extraId: OrderExtraType) => void;
	onFavoriteBoosterNameChange?: (name: string) => void;
	onNextIntent?: () => void;
};

const FILTERED_EXTRAS = EXTRAS.filter((extra) => extra.id !== 'mmr_nerfed');

export const DetailsStep = ({
	favoriteBoosterName = '',
	orderInput,
	onBack,
	onNext,
	onChange,
	onToggleExtra,
	onFavoriteBoosterNameChange,
	onNextIntent,
}: DetailsStepProps) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const mmrWarningRef = useRef<HTMLDivElement>(null);
	const favoriteBoosterRef = useRef<HTMLDivElement>(null);
	const isFavoriteBoosterSelected =
		orderInput.extras.includes('favorite_booster');
	const isNextDisabled =
		isFavoriteBoosterSelected && !favoriteBoosterName.trim();

	const shouldShowMmrWarning = orderInput.lpGain <= 17;
	const { contextSafe } = useGSAP({ scope: containerRef });
	const handleToggleExtra = contextSafe(
		(id: OrderExtraType, event: MouseEvent<HTMLButtonElement>) => {
			if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
				const card = event.currentTarget.closest('.extra-option-card');
				if (card) {
					gsap.fromTo(
						card,
						{ scale: 0.97 },
						{ scale: 1, duration: 0.4, ease: 'back.out(4)' },
					);
				}
			}
			onToggleExtra(id);
		},
	);

	useGSAP(
		() => {
			if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
			gsap.from('.extra-option-card', {
				y: 20,
				opacity: 0,
				duration: 0.5,
				stagger: 0.05,
				ease: 'power2.out',
			});
		},
		{ scope: containerRef },
	);

	useGSAP(
		() => {
			if (
				!shouldShowMmrWarning ||
				window.matchMedia('(prefers-reduced-motion: reduce)').matches
			)
				return;
			gsap.from(mmrWarningRef.current, {
				autoAlpha: 0,
				y: -8,
				duration: 0.25,
				ease: 'power2.out',
			});
		},
		{ scope: containerRef, dependencies: [shouldShowMmrWarning] },
	);

	useGSAP(
		() => {
			if (
				!isFavoriteBoosterSelected ||
				window.matchMedia('(prefers-reduced-motion: reduce)').matches
			)
				return;
			gsap.from(favoriteBoosterRef.current, {
				autoAlpha: 0,
				y: -8,
				duration: 0.3,
				ease: 'back.out(1.2)',
			});
		},
		{ scope: containerRef, dependencies: [isFavoriteBoosterSelected] },
	);

	return (
		<div ref={containerRef} className="space-y-8">
			<div className="space-y-2">
				<h2 className="text-xl font-black uppercase tracking-[0.2em]">
					Detalhes e Extras
				</h2>
				<p className="text-sm leading-relaxed text-white/65">
					Configure os detalhes técnicos do seu pedido.
				</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<div className="space-y-3">
					<Label htmlFor="server">Servidor</Label>
					<Select
						value={orderInput.server}
						onValueChange={(value: string) => onChange('server', value)}
					>
						<SelectTrigger id="server" className="h-12 text-base md:text-sm">
							<SelectValue placeholder="Selecione um servidor" />
						</SelectTrigger>
						<SelectContent>
							{SERVERS.map((server) => (
								<SelectItem key={server.value} value={server.value}>
									{server.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="space-y-3">
					<Label htmlFor="queue">Fila</Label>
					<Select
						value={orderInput.desiredQueue}
						onValueChange={(value: string) => onChange('desiredQueue', value)}
					>
						<SelectTrigger id="queue" className="h-12 text-base md:text-sm">
							<SelectValue placeholder="Selecione uma fila" />
						</SelectTrigger>
						<SelectContent>
							{QUEUES.map((queue) => (
								<SelectItem key={queue.value} value={queue.value}>
									{queue.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="space-y-3">
					<Label htmlFor="lp-gain">Ganho de PDL (Aprox.)</Label>
					<NumberInput
						id="lp-gain"
						name="lpGain"
						min={1}
						value={orderInput.lpGain}
						onChange={(value) => onChange('lpGain', value)}
						placeholder="20"
						className="[&_button]:h-12 [&_button]:w-12 [&_input]:h-12 [&_input]:text-base md:[&_input]:text-sm"
					/>
				</div>
			</div>

			<div className="space-y-4">
				<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
					<h3 className="text-sm font-black uppercase tracking-widest text-white/80">
						Personalize sua experiência
					</h3>
					{shouldShowMmrWarning && (
						<span className="text-xs font-black uppercase tracking-widest text-hextech-cyan">
							Taxa MMR Nerfado Aplicada
						</span>
					)}
				</div>

				{shouldShowMmrWarning ? (
					<div
						ref={mmrWarningRef}
						className="rounded-sm border border-hextech-cyan/20 bg-hextech-cyan/5 p-3"
					>
						<p className="text-sm leading-relaxed text-white/75">
							Se seu ganho de PDL é menor ou igual a 17, isso aumenta a
							dificuldade para nossos boosters. A taxa de MMR Nerfado foi
							aplicada automaticamente.
						</p>
					</div>
				) : null}

				<div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
					{FILTERED_EXTRAS.map((extra) => {
						const isSelected = orderInput.extras.includes(extra.id);
						const isFavoriteBooster = extra.id === 'favorite_booster';

						return (
							<div key={extra.id} className="extra-option-card flex flex-col">
								<SelectableOption
									onClick={(event) => handleToggleExtra(extra.id, event)}
									layout="row"
									selected={isSelected}
									className="flex-1 items-start gap-4 text-left min-h-20"
								>
									<div className="flex min-w-0 items-start gap-3">
										<div
											className={cn(
												'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border transition-colors',
												isSelected
													? 'bg-hextech-cyan border-hextech-cyan'
													: 'border-white/20',
											)}
										>
											{isSelected ? (
												<CheckCircle2
													className="h-3 w-3 text-black"
													aria-hidden="true"
												/>
											) : null}
										</div>
										<div className="min-w-0 space-y-1">
											<span className="block text-xs font-black uppercase tracking-widest">
												{extra.label}
											</span>
											<span
												className={cn(
													'block text-sm leading-relaxed',
													isSelected ? 'text-white/75' : 'text-white/60',
												)}
											>
												{extra.description}
											</span>
										</div>
									</div>
									<Badge
										variant={extra.price === 'Grátis' ? 'success' : 'warning'}
										className="shrink-0"
									>
										{extra.priceLabel}
									</Badge>
								</SelectableOption>
								{isFavoriteBooster && isFavoriteBoosterSelected ? (
									<div ref={favoriteBoosterRef} className="mt-3">
										<div className="rounded-sm border border-white/10 bg-black/20 p-3">
											<div className="flex items-center justify-between gap-3">
												<Label htmlFor="favorite-booster-name">
													Nome do Booster Favorito{' '}
													<span className="text-hextech-cyan">*</span>
												</Label>
												<span className="text-xs text-white/55">
													{favoriteBoosterName.length}/50
												</span>
											</div>
											<Input
												id="favorite-booster-name"
												name="favoriteBoosterName"
												value={favoriteBoosterName}
												onChange={(event) =>
													onFavoriteBoosterNameChange?.(event.target.value)
												}
												maxLength={50}
												placeholder="Digite o nome do booster"
												className="mt-2 h-12 text-base md:text-sm"
											/>
										</div>
									</div>
								) : null}
							</div>
						);
					})}
				</div>
			</div>

			<div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:justify-end">
				<Button
					variant="outline"
					size="lg"
					className="w-full sm:w-auto"
					onClick={onBack}
				>
					Voltar
				</Button>
				<Button
					size="lg"
					onClick={onNext}
					onFocus={onNextIntent}
					onMouseEnter={onNextIntent}
					className="w-full sm:w-auto"
					disabled={isNextDisabled}
				>
					Próximo Passo
					<ChevronRight className="ml-2 h-4 w-4" aria-hidden="true" />
				</Button>
			</div>
		</div>
	);
};
