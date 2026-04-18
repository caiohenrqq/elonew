export const rankPricedOrderServiceTypes = ['elo_boost', 'duo_boost'] as const;

export type RankPricedOrderServiceType =
	(typeof rankPricedOrderServiceTypes)[number];

export type OrderRankStep = {
	league: string;
	division: string;
};

export const orderRankProgression: readonly OrderRankStep[] = [
	{ league: 'iron', division: 'IV' },
	{ league: 'iron', division: 'III' },
	{ league: 'iron', division: 'II' },
	{ league: 'iron', division: 'I' },
	{ league: 'bronze', division: 'IV' },
	{ league: 'bronze', division: 'III' },
	{ league: 'bronze', division: 'II' },
	{ league: 'bronze', division: 'I' },
	{ league: 'silver', division: 'IV' },
	{ league: 'silver', division: 'III' },
	{ league: 'silver', division: 'II' },
	{ league: 'silver', division: 'I' },
	{ league: 'gold', division: 'IV' },
	{ league: 'gold', division: 'III' },
	{ league: 'gold', division: 'II' },
	{ league: 'gold', division: 'I' },
	{ league: 'platinum', division: 'IV' },
	{ league: 'platinum', division: 'III' },
	{ league: 'platinum', division: 'II' },
	{ league: 'platinum', division: 'I' },
	{ league: 'emerald', division: 'IV' },
	{ league: 'emerald', division: 'III' },
	{ league: 'emerald', division: 'II' },
	{ league: 'emerald', division: 'I' },
	{ league: 'diamond', division: 'IV' },
	{ league: 'diamond', division: 'III' },
	{ league: 'diamond', division: 'II' },
	{ league: 'diamond', division: 'I' },
	{ league: 'master', division: 'MASTER' },
] as const;
