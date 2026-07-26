import { WindowThrottlerStorage } from '@app/common/http/window-throttler.storage';

const TTL = 60_000;
const LIMIT = 3;

describe('WindowThrottlerStorage', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		jest.setSystemTime(new Date('2026-07-26T10:00:00.000Z'));
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	const hit = (storage: WindowThrottlerStorage, key: string) =>
		storage.increment(key, TTL, LIMIT, TTL, 'test-route');

	it('blocks a key once it exceeds the limit within the window', async () => {
		const storage = new WindowThrottlerStorage();

		for (let attempt = 0; attempt < LIMIT; attempt++)
			expect(await hit(storage, 'a')).toMatchObject({ isBlocked: false });

		expect(await hit(storage, 'a')).toMatchObject({
			isBlocked: true,
			totalHits: LIMIT + 1,
		});
	});

	it('lets a blocked key through again after the block expires', async () => {
		const storage = new WindowThrottlerStorage();
		for (let attempt = 0; attempt <= LIMIT; attempt++) await hit(storage, 'a');

		jest.advanceTimersByTime(TTL + 1);

		expect(await hit(storage, 'a')).toMatchObject({
			isBlocked: false,
			totalHits: 1,
		});
	});

	it('keeps counters independent per key', async () => {
		const storage = new WindowThrottlerStorage();
		for (let attempt = 0; attempt <= LIMIT; attempt++) await hit(storage, 'a');

		expect(await hit(storage, 'b')).toMatchObject({
			isBlocked: false,
			totalHits: 1,
		});
	});

	// The packaged storage decayed hits with per-hit timers cleared per throttler
	// name, so one key leaving a block froze every other key's counter forever.
	it('decays a key even while another key blocks and resets', async () => {
		const storage = new WindowThrottlerStorage();
		for (let attempt = 0; attempt <= LIMIT; attempt++)
			await hit(storage, 'attacker');

		jest.advanceTimersByTime(TTL - 1_000);
		for (let attempt = 0; attempt < LIMIT; attempt++)
			await hit(storage, 'victim');

		jest.advanceTimersByTime(2_000);
		await hit(storage, 'attacker');

		jest.advanceTimersByTime(TTL + 1);
		expect(await hit(storage, 'victim')).toMatchObject({
			isBlocked: false,
			totalHits: 1,
		});
	});
});
