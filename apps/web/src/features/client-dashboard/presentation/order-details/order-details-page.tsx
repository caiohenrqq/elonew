import { notFound, redirect } from 'next/navigation';
import { ApiRequestError } from '@/shared/api-client-management/http';
import { getOrder } from '../../actions/order-actions';
import { type ClientOrder, toClientOrder } from '../../model/orders';
import { OrderActivityCard } from './order-activity-card';
import { OrderBoosterCard } from './order-booster-card';
import { OrderDetailsHeader } from './order-details-header';
import { OrderServiceCard } from './order-service-card';
import { OrderSupportCard } from './order-support-card';

type OrderDetailsPageProps = {
	orderId: string;
};

export const OrderDetailsPage = async ({ orderId }: OrderDetailsPageProps) => {
	let order: ClientOrder;

	try {
		order = toClientOrder(await getOrder(orderId));
	} catch (error) {
		if (error instanceof ApiRequestError) {
			if (error.status === 401 || error.status === 403) redirect('/login');
			if (error.status === 404) notFound();
		}

		throw error;
	}

	return (
		<div className="space-y-8">
			<OrderDetailsHeader order={order} />

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
				<div className="lg:col-span-2 space-y-8">
					<OrderServiceCard order={order} />
					<OrderActivityCard />
				</div>

				<div className="space-y-8">
					<OrderBoosterCard />
					<OrderSupportCard />
				</div>
			</div>
		</div>
	);
};
