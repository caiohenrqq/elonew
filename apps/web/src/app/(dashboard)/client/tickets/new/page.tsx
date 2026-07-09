import { getClientDashboardOrders } from '@/modules/client-dashboard/actions/order-actions';
import { NewTicketPage } from '@/modules/client-dashboard/presentation/new-ticket/new-ticket-page';

type ClientNewTicketPageProps = {
	searchParams?: Promise<{
		orderId?: string;
	}>;
};

const ClientNewTicketPage = async ({
	searchParams,
}: ClientNewTicketPageProps) => {
	const params = await searchParams;
	const dashboard = await getClientDashboardOrders();

	return (
		<NewTicketPage initialOrderId={params?.orderId} orders={dashboard.orders} />
	);
};

export default ClientNewTicketPage;
