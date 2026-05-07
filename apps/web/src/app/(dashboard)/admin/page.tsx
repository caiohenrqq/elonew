import { getAdminMetrics } from '@/modules/admin-dashboard/actions/admin-actions';
import { AdminDashboardPage } from '@/modules/admin-dashboard/presentation/overview/admin-dashboard-page';

const Page = async () => {
	const metrics = await getAdminMetrics();

	return <AdminDashboardPage metrics={metrics} />;
};

export default Page;
