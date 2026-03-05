import type { Order } from '@modules/orders/domain/order.entity';

export const ORDER_REPOSITORY_KEY = Symbol('ORDER_REPOSITORY_KEY');

export interface OrderRepositoryPort {
	findById(id: string): Promise<Order | null>;
	save(order: Order): Promise<void>;
}
