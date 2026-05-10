import { getAdminDashboard } from '@/modules/admin-dashboard/actions/admin-actions';
import { AdminDashboardPage } from '@/modules/admin-dashboard/presentation/overview/admin-dashboard-page';

const Page = async () => {
	const dashboard = await getAdminDashboard();

	return (
		<AdminDashboardPage
			metrics={dashboard.metrics}
			orders={dashboard.orders}
			tickets={dashboard.tickets}
			users={dashboard.users}
		/>
	);
};

export default Page;
