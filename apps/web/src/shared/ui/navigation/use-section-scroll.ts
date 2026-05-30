'use client';

import { useLenis } from 'lenis/react';
import { useCallback } from 'react';

const MIN_SCROLL_DURATION_SECONDS = 1.1;
const MAX_SCROLL_DURATION_SECONDS = 2.8;
const SCROLL_GUARD_BUFFER_MS = 150;

let activeSectionId: string | null = null;
let releaseActiveSection: ReturnType<typeof setTimeout> | undefined;

function clearActiveSection(sectionId: string) {
	if (activeSectionId !== sectionId) return;

	activeSectionId = null;
}

function getScrollDurationSeconds(target: HTMLElement) {
	const distance = Math.abs(target.getBoundingClientRect().top);
	const duration = 0.85 + distance / 1600;

	return Math.min(
		MAX_SCROLL_DURATION_SECONDS,
		Math.max(MIN_SCROLL_DURATION_SECONDS, duration),
	);
}

function easeInOutCubic(progress: number) {
	return progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
}

function guardSectionScroll(sectionId: string, durationSeconds: number) {
	if (activeSectionId === sectionId) return false;

	activeSectionId = sectionId;

	if (releaseActiveSection) {
		clearTimeout(releaseActiveSection);
	}

	releaseActiveSection = setTimeout(
		() => {
			clearActiveSection(sectionId);
		},
		durationSeconds * 1000 + SCROLL_GUARD_BUFFER_MS,
	);

	return true;
}

export function useSectionScroll() {
	const lenis = useLenis();

	return useCallback(
		(sectionId: string) => {
			const target = document.getElementById(sectionId);
			if (!target) return;

			const duration = getScrollDurationSeconds(target);
			if (!guardSectionScroll(sectionId, duration)) return;

			if (lenis) {
				lenis.scrollTo(target, {
					duration,
					easing: easeInOutCubic,
					lock: true,
					onComplete: () => clearActiveSection(sectionId),
				});
				return;
			}

			target.scrollIntoView({
				behavior: 'smooth',
				block: 'start',
			});
		},
		[lenis],
	);
}
