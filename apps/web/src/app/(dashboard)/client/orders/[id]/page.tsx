import { OrderDetailsPage } from '@/features/client-dashboard/presentation/order-details/order-details-page';

type ClientOrderDetailsRouteProps = {
	params: Promise<{
		id: string;
	}>;
};

const ClientOrderDetailsRoute = async ({
	params,
}: ClientOrderDetailsRouteProps) => {
	const { id } = await params;

	return <OrderDetailsPage orderId={id} />;
};

export default ClientOrderDetailsRoute;
