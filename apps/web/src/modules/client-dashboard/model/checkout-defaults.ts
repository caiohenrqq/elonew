import type { StartCheckoutInput } from '../server/order-contracts';

export const createInitialCheckoutInput = (
	_now = new Date(),
): StartCheckoutInput => ({
	serviceType: 'elo_boost',
	summonerName: '',
	extras: [],
	currentLeague: 'silver',
	currentDivision: 'IV',
	currentLp: 0,
	desiredLeague: 'gold',
	desiredDivision: 'IV',
	server: 'BR',
	desiredQueue: 'solo_duo',
	lpGain: 20,
	paymentMethod: 'pix',
});
