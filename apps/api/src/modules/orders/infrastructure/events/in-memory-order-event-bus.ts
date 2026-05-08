import type {
	OrderEvent,
	OrderEventPublisherPort,
} from '@modules/orders/application/ports/order-event-publisher.port';
import { Injectable } from '@nestjs/common';

type OrderEventSubscriber = (event: OrderEvent) => void;

type OrderEventSubscriptionInput = {
	key?: string;
	close?: () => void;
};

type KeyedOrderEventSubscriber = {
	close?: () => void;
	subscriber: OrderEventSubscriber;
};

@Injectable()
export class InMemoryOrderEventBus implements OrderEventPublisherPort {
	private readonly subscribers = new Set<OrderEventSubscriber>();
	private readonly keyedSubscribers = new Map<
		string,
		KeyedOrderEventSubscriber
	>();

	async publish(event: OrderEvent): Promise<void> {
		for (const subscriber of this.subscribers) {
			try {
				subscriber(event);
			} catch {
				this.subscribers.delete(subscriber);
			}
		}
	}

	subscribe(
		subscriber: OrderEventSubscriber,
		input: OrderEventSubscriptionInput = {},
	): () => void {
		if (input.key) {
			const previousSubscriber = this.keyedSubscribers.get(input.key);
			if (previousSubscriber) {
				previousSubscriber.close?.();
				this.subscribers.delete(previousSubscriber.subscriber);
			}
		}

		this.subscribers.add(subscriber);
		if (input.key) {
			this.keyedSubscribers.set(input.key, {
				close: input.close,
				subscriber,
			});
		}

		return () => {
			this.subscribers.delete(subscriber);
			if (input.key) {
				const currentSubscriber = this.keyedSubscribers.get(input.key);
				if (currentSubscriber?.subscriber === subscriber) {
					this.keyedSubscribers.delete(input.key);
				}
			}
		};
	}
}
