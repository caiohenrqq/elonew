import { EXTRAS } from './new-order-options';

describe('new-order-options', () => {
	it('exposes every checkout extra supported by order pricing', () => {
		expect(EXTRAS.map((extra) => extra.id)).toEqual([
			'mmr_nerfed',
			'mmr_buffed',
			'offline_chat',
			'spell_position',
			'specific_lanes',
			'priority_service',
			'favorite_booster',
			'super_restriction',
			'extra_win',
			'specific_champions',
			'restricted_schedule',
			'online_stream',
			'kd_reduction',
			'deadline_reduction',
			'solo_service',
		]);
	});

	it('keeps displayed paid extra percentages aligned with pricing modifiers', () => {
		expect(
			Object.fromEntries(EXTRAS.map((extra) => [extra.id, extra.priceLabel])),
		).toMatchObject({
			mmr_nerfed: '+ 25%',
			mmr_buffed: '+ 35%',
			priority_service: '+ 10%',
			favorite_booster: '+ 10%',
			super_restriction: '+ 35%',
			extra_win: '+ 20%',
			restricted_schedule: '+ 10%',
			kd_reduction: '+ 30%',
			deadline_reduction: '+ 20%',
			solo_service: '+ 30%',
		});
	});
});
