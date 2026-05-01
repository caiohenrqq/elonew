import { getClientDashboardOrders } from '@/modules/client-dashboard/actions/order-actions';
import { toClientDashboard } from '@/modules/client-dashboard/model/orders';
import { ClientDashboardPage } from '@/modules/client-dashboard/presentation/overview/client-dashboard-page';

const ClientPage = async () => {
	const dashboard = toClientDashboard(await getClientDashboardOrders());

	return <ClientDashboardPage dashboard={dashboard} />;
};

export default ClientPage;
