import {
	getNextRankStep,
	getRankStepIndex,
	isDesiredRankAvailable,
	normalizeDesiredRank,
	normalizeRankDivision,
} from './rank-options';

describe('rank-options', () => {
	it('orders ranks by priced progression', () => {
		expect(getRankStepIndex('silver', 'IV')).toBeLessThan(
			getRankStepIndex('gold', 'IV'),
		);
		expect(getRankStepIndex('gold', 'I')).toBeLessThan(
			getRankStepIndex('platinum', 'IV'),
		);
	});

	it('only allows desired ranks above the current rank', () => {
		expect(isDesiredRankAvailable('silver', 'IV', 'silver', 'IV')).toBe(false);
		expect(isDesiredRankAvailable('silver', 'IV', 'bronze', 'I')).toBe(false);
		expect(isDesiredRankAvailable('silver', 'IV', 'silver', 'III')).toBe(true);
		expect(isDesiredRankAvailable('diamond', 'I', 'diamond', 'I')).toBe(false);
		expect(isDesiredRankAvailable('diamond', 'I', 'diamond', 'II')).toBe(false);
		expect(isDesiredRankAvailable('diamond', 'I', 'master', 'MASTER')).toBe(
			true,
		);
		expect(isDesiredRankAvailable('master', 'MASTER', 'master', 'MASTER')).toBe(
			false,
		);
	});

	it('normalizes invalid desired rank to the next priced step', () => {
		expect(normalizeDesiredRank('silver', 'IV', 'bronze', 'I')).toEqual({
			league: 'silver',
			division: 'III',
		});
	});

	it('normalizes rank divisions when moving between master and divided ranks', () => {
		expect(normalizeRankDivision('master', 'IV')).toBe('MASTER');
		expect(normalizeRankDivision('diamond', 'MASTER')).toBe('IV');
		expect(normalizeRankDivision('diamond', 'II')).toBe('II');
	});

	it('normalizes diamond I to master as the next priced step', () => {
		expect(getNextRankStep('diamond', 'I')).toEqual({
			league: 'master',
			division: 'MASTER',
		});
		expect(normalizeDesiredRank('diamond', 'I', 'diamond', 'I')).toEqual({
			league: 'master',
			division: 'MASTER',
		});
	});

	it('keeps master as the final dead-end rank', () => {
		expect(getNextRankStep('master', 'MASTER')).toEqual({
			league: 'master',
			division: 'MASTER',
		});
	});
});
