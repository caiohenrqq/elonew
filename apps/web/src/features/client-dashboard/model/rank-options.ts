export type RankLeague =
	| 'iron'
	| 'bronze'
	| 'silver'
	| 'gold'
	| 'platinum'
	| 'emerald'
	| 'diamond'
	| 'master';

export type RankStep = {
	division: string;
	league: RankLeague;
};

export type RankOption = {
	accent: string;
	accentSoft: string;
	image: string;
	label: string;
	value: RankLeague;
};

export const RANK_DIVISIONS = ['IV', 'III', 'II', 'I'] as const;
export const MASTER_RANK_DIVISION = 'MASTER' as const;

export const RANK_OPTIONS: RankOption[] = [
	{
		value: 'iron',
		label: 'Ferro',
		image: '/images/ranks/lol/rank-iron.png',
		accent: '#8f8f9a',
		accentSoft: 'rgba(143, 143, 154, 0.18)',
	},
	{
		value: 'bronze',
		label: 'Bronze',
		image: '/images/ranks/lol/rank-bronze.png',
		accent: '#b57a4b',
		accentSoft: 'rgba(181, 122, 75, 0.2)',
	},
	{
		value: 'silver',
		label: 'Prata',
		image: '/images/ranks/lol/rank-silver.png',
		accent: '#b9d0d6',
		accentSoft: 'rgba(185, 208, 214, 0.18)',
	},
	{
		value: 'gold',
		label: 'Ouro',
		image: '/images/ranks/lol/rank-gold.png',
		accent: '#e2b64b',
		accentSoft: 'rgba(226, 182, 75, 0.22)',
	},
	{
		value: 'platinum',
		label: 'Platina',
		image: '/images/ranks/lol/rank-platinum.png',
		accent: '#66d6c8',
		accentSoft: 'rgba(102, 214, 200, 0.18)',
	},
	{
		value: 'emerald',
		label: 'Esmeralda',
		image: '/images/ranks/lol/rank-emerald.png',
		accent: '#31d17c',
		accentSoft: 'rgba(49, 209, 124, 0.2)',
	},
	{
		value: 'diamond',
		label: 'Diamante',
		image: '/images/ranks/lol/rank-diamond.png',
		accent: '#8bd7ff',
		accentSoft: 'rgba(139, 215, 255, 0.2)',
	},
	{
		value: 'master',
		label: 'Master',
		image: '/images/ranks/lol/rank-master.png',
		accent: '#c95eff',
		accentSoft: 'rgba(201, 94, 255, 0.18)',
	},
];

const pricedRankSteps: RankStep[] = RANK_OPTIONS.flatMap((rank): RankStep[] => {
	if (rank.value === 'master') {
		return [{ league: rank.value, division: MASTER_RANK_DIVISION }];
	}

	return RANK_DIVISIONS.map((division) => ({
		league: rank.value,
		division,
	}));
});

export const isRankWithoutDivisions = (league: string) => {
	return league === 'master';
};

export const getRankDivisionLabel = (division: string) => {
	return division === MASTER_RANK_DIVISION ? 'Sem divisão' : division;
};

export const normalizeRankDivision = (league: string, division: string) => {
	if (isRankWithoutDivisions(league)) return MASTER_RANK_DIVISION;

	return RANK_DIVISIONS.includes(division as (typeof RANK_DIVISIONS)[number])
		? division
		: RANK_DIVISIONS[0];
};

export const getRankStepIndex = (league: string, division: string) => {
	return pricedRankSteps.findIndex(
		(step) => step.league === league && step.division === division,
	);
};

export const isDesiredRankAvailable = (
	currentLeague: string,
	currentDivision: string,
	desiredLeague: string,
	desiredDivision: string,
) => {
	const currentIndex = getRankStepIndex(currentLeague, currentDivision);
	const desiredIndex = getRankStepIndex(desiredLeague, desiredDivision);

	return currentIndex >= 0 && desiredIndex > currentIndex;
};

export const getNextRankStep = (
	currentLeague: string,
	currentDivision: string,
): RankStep => {
	const currentIndex = getRankStepIndex(currentLeague, currentDivision);
	const nextStep = pricedRankSteps[currentIndex + 1] ?? pricedRankSteps.at(-1);

	return nextStep ?? { league: 'iron', division: 'IV' };
};

export const normalizeDesiredRank = (
	currentLeague: string,
	currentDivision: string,
	desiredLeague: string,
	desiredDivision: string,
): RankStep => {
	if (
		isDesiredRankAvailable(
			currentLeague,
			currentDivision,
			desiredLeague,
			desiredDivision,
		)
	) {
		return {
			league: desiredLeague as RankLeague,
			division: desiredDivision,
		};
	}

	return getNextRankStep(currentLeague, currentDivision);
};

export const getRankOption = (league: string) => {
	return RANK_OPTIONS.find((rank) => rank.value === league) ?? RANK_OPTIONS[0];
};
