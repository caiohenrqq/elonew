import { render } from '@testing-library/react';
import { useDashboardEvents } from './use-dashboard-events';

const refresh = jest.fn();

jest.mock('next/navigation', () => ({
	useRouter: () => ({
		refresh,
	}),
}));

class EventSourceStub {
	static instances: EventSourceStub[] = [];

	readonly listeners = new Map<string, EventListener>();
	closed = false;

	constructor(readonly url: string) {
		EventSourceStub.instances.push(this);
	}

	addEventListener(type: string, listener: EventListener): void {
		this.listeners.set(type, listener);
	}

	removeEventListener(type: string): void {
		this.listeners.delete(type);
	}

	close(): void {
		this.closed = true;
	}

	emit(type: string): void {
		this.listeners.get(type)?.(new MessageEvent(type));
	}

	dispatch(type: string): void {
		this.listeners.get(type)?.(new Event(type));
	}
}

const TestDashboardEvents = () => {
	useDashboardEvents({ events: ['order.paid'] });

	return null;
};

describe('useDashboardEvents', () => {
	const originalEventSource = global.EventSource;

	beforeEach(() => {
		jest.useFakeTimers();
		jest.clearAllMocks();
		EventSourceStub.instances = [];
		global.EventSource =
			EventSourceStub as unknown as typeof global.EventSource;
	});

	afterEach(() => {
		jest.useRealTimers();
		global.EventSource = originalEventSource;
	});

	it('refreshes the router once for debounced order events', () => {
		render(<TestDashboardEvents />);
		const eventSource = EventSourceStub.instances[0];

		eventSource?.emit('order.paid');
		eventSource?.emit('order.paid');
		jest.advanceTimersByTime(500);

		expect(refresh).toHaveBeenCalledTimes(1);
		expect(eventSource?.url).toBe('/api/orders/events');
	});

	it('closes the stream on unmount', () => {
		const { unmount } = render(<TestDashboardEvents />);
		const eventSource = EventSourceStub.instances[0];

		unmount();

		expect(eventSource?.closed).toBe(true);
		expect(eventSource?.listeners.size).toBe(0);
	});

	it('keeps the stream open when the browser reports a transient error', () => {
		render(<TestDashboardEvents />);
		const eventSource = EventSourceStub.instances[0];

		eventSource?.dispatch('error');

		expect(eventSource?.closed).toBe(false);
	});

	it('closes the stream on auth expiration events', () => {
		render(<TestDashboardEvents />);
		const eventSource = EventSourceStub.instances[0];

		eventSource?.dispatch('auth.expired');

		expect(eventSource?.closed).toBe(true);
	});
});
