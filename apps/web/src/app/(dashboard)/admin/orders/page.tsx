import { getAdminOrders } from '@/modules/admin-dashboard/actions/admin-actions';
import { AdminOrdersPage } from '@/modules/admin-dashboard/presentation/overview/admin-dashboard-page';

const Page = async () => {
	const orders = await getAdminOrders();

	return <AdminOrdersPage orders={orders} />;
};

export default Page;
