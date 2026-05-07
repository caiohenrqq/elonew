import { getAdminUsers } from '@/modules/admin-dashboard/actions/admin-actions';
import { AdminUsersPage } from '@/modules/admin-dashboard/presentation/overview/admin-dashboard-page';

const Page = async () => {
	const users = await getAdminUsers();

	return <AdminUsersPage users={users} />;
};

export default Page;
