import { AdminOrderDetailsPage } from '@/modules/admin-dashboard/presentation/order-details/admin-order-details-page';

type AdminOrderDetailsRouteProps = {
	params: Promise<{
		id: string;
	}>;
};

const AdminOrderDetailsRoute = async ({
	params,
}: AdminOrderDetailsRouteProps) => {
	const { id } = await params;

	return <AdminOrderDetailsPage orderId={id} />;
};

export default AdminOrderDetailsRoute;
