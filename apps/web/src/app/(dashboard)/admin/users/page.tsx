import {
	getAdminUserId,
	getAdminUsers,
} from '@/modules/admin-dashboard/actions/admin-actions';
import { AdminUsersPage } from '@/modules/admin-dashboard/presentation/overview/admin-dashboard-page';

const Page = async () => {
	const [users, currentAdminId] = await Promise.all([
		getAdminUsers(),
		getAdminUserId(),
	]);

	return <AdminUsersPage users={users} currentAdminId={currentAdminId} />;
};

export default Page;
