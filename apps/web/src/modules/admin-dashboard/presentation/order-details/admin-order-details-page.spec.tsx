import type { ReactElement } from 'react';
import { getOrderRatings } from '@/shared/ratings/rating-actions';
import {
	getAdminOrder,
	getAdminOrderChatMessages,
	getAdminUserId,
} from '../../actions/admin-actions';
import { AdminOrderDetailsPage } from './admin-order-details-page';

jest.mock('next/navigation', () => ({ notFound: jest.fn() }));
jest.mock('@/shared/ratings/rating-actions', () => ({
	getOrderRatings: jest.fn().mockResolvedValue([
		{
			id: 'rating-1',
			orderId: 'order-1',
			fromUserId: 'client-1',
			toUserId: 'booster-1',
			score: 5,
			comment: 'Ótimo serviço',
			createdAt: '2026-08-04T01:34:36.000Z',
		},
	]),
}));
jest.mock('../../actions/admin-actions', () => ({
	getAdminOrder: jest.fn().mockResolvedValue({
		id: 'order-1',
		clientId: 'client-1',
		status: 'completed',
	}),
	getAdminOrderChatMessages: jest
		.fn()
		.mockResolvedValue({ items: [], nextCursor: null }),
	getAdminUserId: jest.fn().mockResolvedValue('admin-1'),
}));

describe('AdminOrderDetailsPage', () => {
	it('loads ratings with every order detail', async () => {
		const page = (await AdminOrderDetailsPage({
			orderId: 'order-1',
		})) as ReactElement<{ ratings: Array<{ id: string }> }>;

		expect(getAdminOrder).toHaveBeenCalledWith('order-1');
		expect(getAdminOrderChatMessages).toHaveBeenCalledWith('order-1');
		expect(getAdminUserId).toHaveBeenCalledTimes(1);
		expect(getOrderRatings).toHaveBeenCalledWith('order-1');
		expect(page.props.ratings).toEqual([
			expect.objectContaining({ id: 'rating-1' }),
		]);
	});
});
