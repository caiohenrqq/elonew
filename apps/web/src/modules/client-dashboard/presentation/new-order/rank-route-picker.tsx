import { gsap, useGSAP } from '@packages/ui/animation/gsap';
import { cn } from '@packages/ui/utils/cn';
import Image from 'next/image';
import { type CSSProperties, useRef } from 'react';
import {
	getRankDivisionLabel,
	getRankOption,
	isDesiredRankAvailable,
	isRankWithoutDivisions,
	MASTER_RANK_DIVISION,
	normalizeDesiredRank,
	normalizeRankDivision,
	RANK_DIVISIONS,
	RANK_OPTIONS,
	type RankLeague,
} from '../../model/rank-options';
import type { StartCheckoutInput } from '../../server/order-contracts';

type RankRoutePickerProps = {
	orderInput: StartCheckoutInput;
	onChange: <Key extends keyof StartCheckoutInput>(
		key: Key,
		value: StartCheckoutInput[Key],
	) => void;
};

type RankField = 'current' | 'desired';

type RankPanelProps = {
	currentDivision: string;
	currentLeague: string;
	field: RankField;
	onDivisionChange: (division: string) => void;
	onLeagueChange: (league: RankLeague) => void;
	selectedDivision: string;
	selectedLeague: string;
};

const copy = {
	current: {
		title: 'Rank atual',
		description: 'De onde a subida começa.',
	},
	desired: {
		title: 'Rank desejado',
		description: 'Para onde o pedido deve chegar.',
	},
} satisfies Record<RankField, { title: string; description: string }>;

const isValidDesiredSelection = (
	field: RankField,
	currentLeague: string,
	currentDivision: string,
	selectedLeague: string,
	selectedDivision: string,
) => {
	return (
		field !== 'desired' ||
		isDesiredRankAvailable(
			currentLeague,
			currentDivision,
			selectedLeague,
			selectedDivision,
		)
	);
};

const RankPanel = ({
	currentDivision,
	currentLeague,
	field,
	onDivisionChange,
	onLeagueChange,
	selectedDivision,
	selectedLeague,
}: RankPanelProps) => {
	const selectedRank = getRankOption(selectedLeague);
	const initialRank = useRef(selectedRank);
	const panelRef = useRef<HTMLElement>(null);
	const hasDivisions = !isRankWithoutDivisions(selectedLeague);
	const hasValidSelection = isValidDesiredSelection(
		field,
		currentLeague,
		currentDivision,
		selectedLeague,
		selectedDivision,
	);

	useGSAP(
		() => {
			gsap.to(panelRef.current, {
				'--rank-accent': selectedRank.accent,
				'--rank-accent-soft': selectedRank.accentSoft,
				duration: 0.45,
				ease: 'power2.out',
				overwrite: 'auto',
			});
		},
		{ scope: panelRef, dependencies: [selectedRank] },
	);

	return (
		<section
			ref={panelRef}
			className="relative overflow-hidden rounded-sm border border-white/10 bg-[#0d0d0f]/80 p-4"
			aria-labelledby={`${field}-rank-title`}
			style={
				{
					'--rank-accent': initialRank.current.accent,
					'--rank-accent-soft': initialRank.current.accentSoft,
				} as CSSProperties
			}
		>
			<div
				className="pointer-events-none absolute inset-0 opacity-80"
				style={{
					background:
						'radial-gradient(circle at 50% 0%, var(--rank-accent-soft), transparent 58%)',
				}}
			/>
			<div className="relative space-y-4">
				<div className="flex items-start justify-between gap-4">
					<div>
						<h3
							id={`${field}-rank-title`}
							className="text-xs font-black uppercase tracking-[0.18em] text-white"
						>
							{copy[field].title}
						</h3>
						<p className="mt-1 text-[10px] text-white/40">
							{copy[field].description}
						</p>
					</div>
					<div className="text-right">
						<p className="text-[10px] font-black uppercase tracking-[0.16em] text-white">
							{selectedRank.label}
						</p>
						<p className="text-[10px] text-white/45">
							{getRankDivisionLabel(selectedDivision)}
						</p>
					</div>
				</div>

				<div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
					{RANK_OPTIONS.map((rank) => {
						const isSelected =
							selectedLeague === rank.value && hasValidSelection;
						const rankDivisions = isRankWithoutDivisions(rank.value)
							? [MASTER_RANK_DIVISION]
							: RANK_DIVISIONS;
						const isDisabled =
							field === 'desired' &&
							!rankDivisions.some((division) =>
								isDesiredRankAvailable(
									currentLeague,
									currentDivision,
									rank.value,
									division,
								),
							);

						return (
							<button
								key={rank.value}
								type="button"
								aria-pressed={isSelected}
								disabled={isDisabled}
								onClick={() => onLeagueChange(rank.value)}
								className={cn(
									'group flex min-h-[118px] cursor-pointer flex-col items-center justify-between rounded-sm border p-2 text-center transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-25',
									isSelected
										? 'border-[var(--rank-accent)] bg-white/[0.07] text-white'
										: 'border-white/10 bg-black/20 text-white/45 hover:border-white/25 hover:text-white',
								)}
								style={
									{
										'--rank-accent': rank.accent,
									} as CSSProperties
								}
							>
								<Image
									src={rank.image}
									alt=""
									width={96}
									height={96}
									sizes="64px"
									className={cn(
										'h-16 w-16 object-contain transition-transform duration-200',
										isSelected ? 'scale-105' : 'group-hover:scale-105',
									)}
								/>
								<span className="text-[9px] font-black uppercase tracking-[0.14em]">
									{rank.label}
								</span>
							</button>
						);
					})}
				</div>

				<fieldset className="grid grid-cols-4 overflow-hidden rounded-sm border border-white/10 bg-black/20">
					<legend className="sr-only">{copy[field].title}: divisão</legend>
					{RANK_DIVISIONS.map((division) => {
						const isSelected =
							hasDivisions &&
							selectedDivision === division &&
							hasValidSelection;
						const isDisabled =
							!hasDivisions ||
							(field === 'desired' &&
								!isDesiredRankAvailable(
									currentLeague,
									currentDivision,
									selectedLeague,
									division,
								));

						return (
							<button
								key={division}
								type="button"
								aria-pressed={isSelected}
								disabled={isDisabled}
								onClick={() => onDivisionChange(division)}
								className={cn(
									'h-10 cursor-pointer border-r border-white/10 text-[10px] font-black uppercase tracking-[0.18em] transition-colors last:border-r-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--rank-accent)] disabled:cursor-not-allowed disabled:text-white/15',
									isSelected
										? 'bg-[var(--rank-accent)] text-black'
										: 'text-white/50 hover:bg-white/5 hover:text-white',
								)}
							>
								{division}
							</button>
						);
					})}
				</fieldset>
			</div>
		</section>
	);
};

export const RankRoutePicker = ({
	orderInput,
	onChange,
}: RankRoutePickerProps) => {
	const canSelectDesiredRank = isDesiredRankAvailable(
		orderInput.currentLeague,
		orderInput.currentDivision,
		orderInput.desiredLeague,
		orderInput.desiredDivision,
	);

	const changeCurrentRank = (league: RankLeague, division: string) => {
		const nextCurrentDivision = normalizeRankDivision(league, division);
		const desired = normalizeDesiredRank(
			league,
			nextCurrentDivision,
			orderInput.desiredLeague,
			orderInput.desiredDivision,
		);

		onChange('currentLeague', league);
		onChange('currentDivision', nextCurrentDivision);
		onChange('desiredLeague', desired.league);
		onChange('desiredDivision', desired.division);
	};

	const changeDesiredRank = (league: RankLeague, division: string) => {
		const nextDesiredDivision = normalizeRankDivision(league, division);
		const desired = normalizeDesiredRank(
			orderInput.currentLeague,
			orderInput.currentDivision,
			league,
			nextDesiredDivision,
		);

		onChange('desiredLeague', desired.league);
		onChange('desiredDivision', desired.division);
	};

	return (
		<div className="grid grid-cols-1 gap-4">
			<RankPanel
				field="current"
				currentLeague={orderInput.currentLeague}
				currentDivision={orderInput.currentDivision}
				selectedLeague={orderInput.currentLeague}
				selectedDivision={orderInput.currentDivision}
				onLeagueChange={(league) =>
					changeCurrentRank(league, orderInput.currentDivision)
				}
				onDivisionChange={(division) =>
					changeCurrentRank(orderInput.currentLeague as RankLeague, division)
				}
			/>
			<RankPanel
				field="desired"
				currentLeague={orderInput.currentLeague}
				currentDivision={orderInput.currentDivision}
				selectedLeague={orderInput.desiredLeague}
				selectedDivision={orderInput.desiredDivision}
				onLeagueChange={(league) =>
					changeDesiredRank(league, orderInput.desiredDivision)
				}
				onDivisionChange={(division) =>
					changeDesiredRank(orderInput.desiredLeague as RankLeague, division)
				}
			/>
			{canSelectDesiredRank ? null : (
				<p className="text-[10px] text-red-300 uppercase tracking-widest">
					Escolha um rank desejado acima do rank atual.
				</p>
			)}
		</div>
	);
};
