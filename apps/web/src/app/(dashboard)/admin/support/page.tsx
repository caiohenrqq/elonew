import { getAdminSupportTickets } from '@/modules/admin-dashboard/actions/admin-actions';
import { AdminSupportPage } from '@/modules/admin-dashboard/presentation/overview/admin-dashboard-page';

const Page = async () => {
	const tickets = await getAdminSupportTickets();

	return <AdminSupportPage tickets={tickets} />;
};

export default Page;
