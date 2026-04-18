import type { StartCheckoutInput } from '../server/order-contracts';

const checkoutDeadlineOffsetMs = 7 * 24 * 60 * 60 * 1000;

export const createInitialCheckoutInput = (
	now = new Date(),
): StartCheckoutInput => ({
	serviceType: 'elo_boost',
	extras: [],
	currentLeague: 'silver',
	currentDivision: 'IV',
	currentLp: 0,
	desiredLeague: 'gold',
	desiredDivision: 'IV',
	server: 'BR',
	desiredQueue: 'solo_duo',
	lpGain: 20,
	deadline: new Date(now.getTime() + checkoutDeadlineOffsetMs).toISOString(),
	paymentMethod: 'pix',
});
