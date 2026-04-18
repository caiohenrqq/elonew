import { gsap, useGSAP } from '@packages/ui/animation/gsap';
import { Badge } from '@packages/ui/components/badge';
import { Button } from '@packages/ui/components/button';
import { Input } from '@packages/ui/components/input';
import { Label } from '@packages/ui/components/label';
import { NumberInput } from '@packages/ui/components/number-input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@packages/ui/components/select';
import { cn } from '@packages/ui/utils/cn';
import { CheckCircle2, ChevronRight } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { EXTRAS, QUEUES, SERVERS } from '../../model/new-order-options';
import type { StartCheckoutInput } from '../../server/order-contracts';
import { SelectableOption } from './selectable-option';

type DetailsStepProps = {
	orderInput: StartCheckoutInput;
	onBack: () => void;
	onNext: () => void;
	onChange: <Key extends keyof StartCheckoutInput>(
		key: Key,
		value: StartCheckoutInput[Key],
	) => void;
	onToggleExtra: (extraId: string) => void;
};

const FILTERED_EXTRAS = EXTRAS.filter((extra) => extra.id !== 'mmr_nerfed');

export const DetailsStep = ({
	orderInput,
	onBack,
	onNext,
	onChange,
	onToggleExtra,
}: DetailsStepProps) => {
	const [favoriteBoosterName, setFavoriteBoosterName] = useState('');
	const containerRef = useRef<HTMLDivElement>(null);
	const mmrWarningRef = useRef<HTMLDivElement>(null);
	const boosterInputRefs = useRef<Record<string, HTMLDivElement | null>>({});

	const isFavoriteBoosterSelected = useMemo(
		() => orderInput.extras.includes('favorite_booster'),
		[orderInput.extras],
	);
	const isNextDisabled = useMemo(
		() => isFavoriteBoosterSelected && !favoriteBoosterName.trim(),
		[isFavoriteBoosterSelected, favoriteBoosterName],
	);

	const { contextSafe } = useGSAP({ scope: containerRef });

	const handleToggleWithAnimation = contextSafe(
		(id: string, event: React.MouseEvent) => {
			const card = (event.currentTarget as HTMLElement).closest(
				'.extra-option-card',
			);
			if (card) {
				gsap.fromTo(
					card,
					{ scale: 0.97 },
					{ scale: 1, duration: 0.4, ease: 'back.out(4)' },
				);
			}
			onToggleExtra(id);
		},
	);

	useGSAP(
		() => {
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

	const shouldShowMmrWarning = orderInput.lpGain <= 17;

	useGSAP(
		() => {
			if (shouldShowMmrWarning) {
				gsap.fromTo(
					mmrWarningRef.current,
					{ height: 0, opacity: 0, marginTop: 0 },
					{
						height: 'auto',
						opacity: 1,
						marginTop: 16,
						duration: 0.4,
						ease: 'power3.out',
					},
				);
			} else {
				gsap.to(mmrWarningRef.current, {
					height: 0,
					opacity: 0,
					marginTop: 0,
					duration: 0.3,
					ease: 'power3.in',
				});
			}
		},
		{ dependencies: [shouldShowMmrWarning] },
	);

	useGSAP(
		() => {
			const el = boosterInputRefs.current.favorite_booster;
			if (isFavoriteBoosterSelected) {
				gsap.fromTo(
					el,
					{ height: 0, opacity: 0, marginTop: 0 },
					{
						height: 'auto',
						opacity: 1,
						marginTop: 12,
						duration: 0.4,
						ease: 'back.out(1.2)',
					},
				);
			} else {
				gsap.to(el, {
					height: 0,
					opacity: 0,
					marginTop: 0,
					duration: 0.3,
					ease: 'power3.in',
				});
			}
		},
		{ dependencies: [isFavoriteBoosterSelected] },
	);

	return (
		<div ref={containerRef} className="space-y-8">
			<div className="space-y-2">
				<h2 className="text-xl font-black uppercase tracking-[0.2em]">
					Detalhes e Extras
				</h2>
				<p className="text-white/40 text-xs">
					Configure os detalhes técnicos do seu pedido.
				</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<div className="space-y-3">
					<Label htmlFor="server">Servidor</Label>
					<Select
						value={orderInput.server}
						onValueChange={(value) => onChange('server', value)}
					>
						<SelectTrigger id="server">
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
						onValueChange={(value) => onChange('desiredQueue', value)}
					>
						<SelectTrigger id="queue">
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
					/>
				</div>
			</div>

			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<Label>Personalize sua experiência</Label>
					{shouldShowMmrWarning && (
						<span className="text-[10px] font-black uppercase tracking-widest text-hextech-cyan animate-pulse">
							Taxa MMR Nerfado Aplicada
						</span>
					)}
				</div>

				<div
					ref={mmrWarningRef}
					className="overflow-hidden opacity-0"
					style={{ height: 0 }}
				>
					<div className="rounded-sm border border-hextech-cyan/20 bg-hextech-cyan/5 p-3">
						<p className="text-[10px] leading-relaxed text-hextech-cyan/80">
							Se seu ganho de PDL é menor ou igual a 17, isso aumenta a
							dificuldade para nossos boosters. A taxa de MMR Nerfado foi
							aplicada automaticamente.
						</p>
					</div>
				</div>

				<div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
					{FILTERED_EXTRAS.map((extra) => {
						const isSelected = orderInput.extras.includes(extra.id);
						const isFavoriteBooster = extra.id === 'favorite_booster';

						return (
							<div key={extra.id} className="extra-option-card flex flex-col">
								<SelectableOption
									onClick={(e) => handleToggleWithAnimation(extra.id, e)}
									layout="row"
									selected={isSelected}
									className="flex-1 items-start gap-4 text-left min-h-[80px]"
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
												<CheckCircle2 className="w-3 h-3 text-black" />
											) : null}
										</div>
										<div className="min-w-0 space-y-1">
											<span className="block text-[10px] font-black uppercase tracking-widest">
												{extra.label}
											</span>
											<span
												className={cn(
													'block text-[10px] leading-relaxed',
													isSelected ? 'text-white/60' : 'text-white/35',
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
								{isFavoriteBooster ? (
									<div
										ref={(el) => {
											boosterInputRefs.current.favorite_booster = el;
										}}
										className="overflow-hidden opacity-0"
										style={{ height: 0 }}
									>
										<div className="rounded-sm border border-white/10 bg-black/20 p-3">
											<div className="flex items-center justify-between">
												<Label
													htmlFor="favorite-booster-name"
													className="text-[10px]"
												>
													Nome do Booster Favorito{' '}
													<span className="text-hextech-cyan">*</span>
												</Label>
												<span className="text-[10px] text-white/20">
													{favoriteBoosterName.length}/50
												</span>
											</div>
											<Input
												id="favorite-booster-name"
												name="favoriteBoosterName"
												value={favoriteBoosterName}
												onChange={(event) =>
													setFavoriteBoosterName(
														event.target.value.slice(0, 50),
													)
												}
												placeholder="Digite o nome do booster"
												className="mt-2"
											/>
										</div>
									</div>
								) : null}
							</div>
						);
					})}
				</div>
			</div>

			<div className="flex justify-end gap-4 pt-6 border-t border-white/5 mt-8">
				<Button variant="outline" className="px-8" onClick={onBack}>
					Voltar
				</Button>
				<Button
					onClick={onNext}
					className="group px-8"
					disabled={isNextDisabled}
				>
					Revisar Pedido
					<ChevronRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
				</Button>
			</div>
		</div>
	);
};
