import {
	getClientDashboardOrders,
	getSupportTickets,
} from '@/modules/client-dashboard/actions/order-actions';
import { parseClientDashboardTab } from '@/modules/client-dashboard/model/client-tabs';
import { ClientDashboardPage } from '@/modules/client-dashboard/presentation/overview/client-dashboard-page';

type ClientPageProps = {
	searchParams?: Promise<{
		devPaymentId?: string;
		tab?: string;
	}>;
};

const ClientPage = async ({ searchParams }: ClientPageProps) => {
	const params = await searchParams;
	const tab = parseClientDashboardTab(params?.tab);
	const [dashboard, tickets] =
		tab === 'tickets'
			? [undefined, await getSupportTickets()]
			: [await getClientDashboardOrders(), []];

	return (
		<ClientDashboardPage
			dashboard={dashboard}
			devPaymentId={params?.devPaymentId}
			tab={tab}
			tickets={tickets}
		/>
	);
};

export default ClientPage;
