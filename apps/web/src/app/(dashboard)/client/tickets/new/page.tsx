import { getClientDashboardOrders } from '@/modules/client-dashboard/actions/order-actions';
import { NewTicketPage } from '@/modules/client-dashboard/presentation/new-ticket/new-ticket-page';

const ClientNewTicketPage = async () => {
	const dashboard = await getClientDashboardOrders();

	return <NewTicketPage orders={dashboard.orders} />;
};

export default ClientNewTicketPage;
