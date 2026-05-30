import { getClientDashboardOrders } from '@/modules/client-dashboard/actions/order-actions';
import { ClientDashboardPage } from '@/modules/client-dashboard/presentation/overview/client-dashboard-page';

type ClientPageProps = {
	searchParams?: Promise<{
		devPaymentId?: string;
	}>;
};

const ClientPage = async ({ searchParams }: ClientPageProps) => {
	const params = await searchParams;
	const dashboard = await getClientDashboardOrders();

	return (
		<ClientDashboardPage
			dashboard={dashboard}
			devPaymentId={params?.devPaymentId}
		/>
	);
};

export default ClientPage;
