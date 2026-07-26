import { Injectable } from '@nestjs/common';
import type { ThrottlerStorage } from '@nestjs/throttler';
import type { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface';

type ThrottleWindow = {
	totalHits: number;
	expiresAt: number;
	blockExpiresAt: number;
};

const PRUNE_THRESHOLD = 10_000;

// Replaces the packaged in-memory storage, which decays hit counts with one
// setTimeout per hit and cancels those timers per throttler *name* rather than
// per key: any single caller leaving a block would freeze every other caller's
// counter on that route for the lifetime of the process. Windows are compared
// against the clock instead, so keys cannot affect each other.
@Injectable()
export class WindowThrottlerStorage implements ThrottlerStorage {
	private readonly windows = new Map<string, ThrottleWindow>();

	increment(
		key: string,
		ttl: number,
		limit: number,
		blockDuration: number,
		_throttlerName: string,
	): Promise<ThrottlerStorageRecord> {
		const now = Date.now();
		const window = this.resolveWindow(key, now, ttl);

		if (window.blockExpiresAt <= now) {
			window.totalHits += 1;
			if (window.totalHits > limit) window.blockExpiresAt = now + blockDuration;
		}

		return Promise.resolve({
			totalHits: window.totalHits,
			timeToExpire: Math.ceil((window.expiresAt - now) / 1000),
			isBlocked: window.blockExpiresAt > now,
			timeToBlockExpire: Math.ceil(
				Math.max(window.blockExpiresAt - now, 0) / 1000,
			),
		});
	}

	private resolveWindow(key: string, now: number, ttl: number): ThrottleWindow {
		const window = this.windows.get(key);
		if (window && (window.expiresAt > now || window.blockExpiresAt > now)) {
			if (window.expiresAt <= now && window.blockExpiresAt <= now) {
				window.totalHits = 0;
				window.expiresAt = now + ttl;
			}
			return window;
		}

		if (this.windows.size >= PRUNE_THRESHOLD) this.prune(now);
		const freshWindow = {
			totalHits: 0,
			expiresAt: now + ttl,
			blockExpiresAt: 0,
		};
		this.windows.set(key, freshWindow);

		return freshWindow;
	}

	// ponytail: linear sweep on a size threshold, since entries are only dropped
	// when the map grows. Move to a Redis store if the API ever runs replicated,
	// which this cannot serve anyway.
	private prune(now: number): void {
		for (const [key, window] of this.windows)
			if (window.expiresAt <= now && window.blockExpiresAt <= now)
				this.windows.delete(key);
	}
}
