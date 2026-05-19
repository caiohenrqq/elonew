import { BoosterOrderDetailsPage } from '@/modules/booster-dashboard/presentation/order-details/booster-order-details-page';

type BoosterOrderDetailsRouteProps = {
	params: Promise<{
		id: string;
	}>;
};

const BoosterOrderDetailsRoute = async ({
	params,
}: BoosterOrderDetailsRouteProps) => {
	const { id } = await params;

	return <BoosterOrderDetailsPage orderId={id} />;
};

export default BoosterOrderDetailsRoute;
