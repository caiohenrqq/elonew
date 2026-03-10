import { BadRequestException } from '@nestjs/common';
import { createOrderSchema } from '@shared/orders/create-order.schema';
import { ZodValidationPipe } from './zod-validation.pipe';

describe('ZodValidationPipe', () => {
	it('returns parsed values for a valid payload', () => {
		const pipe = new ZodValidationPipe(createOrderSchema);

		expect(
			pipe.transform({
				serviceType: 'elo_boost',
				currentLeague: 'gold',
				currentDivision: 'II',
				currentLp: 50,
				desiredLeague: 'platinum',
				desiredDivision: 'IV',
				server: 'br',
				desiredQueue: 'solo_duo',
				lpGain: 20,
				deadline: '2026-03-31T00:00:00.000Z',
			}),
		).toEqual({
			serviceType: 'elo_boost',
			currentLeague: 'gold',
			currentDivision: 'II',
			currentLp: 50,
			desiredLeague: 'platinum',
			desiredDivision: 'IV',
			server: 'br',
			desiredQueue: 'solo_duo',
			lpGain: 20,
			deadline: '2026-03-31T00:00:00.000Z',
		});
	});

	it('maps invalid payloads to bad request errors', () => {
		const pipe = new ZodValidationPipe(createOrderSchema);

		expect(() =>
			pipe.transform({
				serviceType: 'unsupported',
				currentLeague: '',
				currentDivision: 'II',
				currentLp: 50.5,
				desiredLeague: 'platinum',
				desiredDivision: 'IV',
				server: 'br',
				desiredQueue: 'solo_duo',
				lpGain: 20,
				deadline: 'invalid-date',
			}),
		).toThrow(BadRequestException);
	});
});
