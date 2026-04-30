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
		expect(isDesiredRankAvailable('master', '0', 'master', '25')).toBe(true);
		expect(isDesiredRankAvailable('master', '25', 'master', '25')).toBe(false);
		expect(isDesiredRankAvailable('master', '25', 'master', '10')).toBe(false);
	});

	it('normalizes invalid desired rank to the next priced step', () => {
		expect(normalizeDesiredRank('silver', 'IV', 'bronze', 'I')).toEqual({
			league: 'silver',
			division: 'III',
		});
	});

	it('normalizes rank divisions when moving between master and divided ranks', () => {
		expect(normalizeRankDivision('master', 'IV')).toBe('0');
		expect(normalizeRankDivision('master', '25')).toBe('25');
		expect(normalizeRankDivision('master', '999')).toBe('250');
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
			division: '0',
		});
	});

	it('normalizes master progression by PDL', () => {
		expect(getNextRankStep('master', '0')).toEqual({
			league: 'master',
			division: '1',
		});
		expect(normalizeDesiredRank('master', '10', 'master', '10')).toEqual({
			league: 'master',
			division: '11',
		});
	});
});
