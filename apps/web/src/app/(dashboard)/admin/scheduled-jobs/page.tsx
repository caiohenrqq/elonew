import { getAdminScheduledJobs } from '@/modules/admin-dashboard/actions/admin-actions';
import { AdminScheduledJobsPage } from '@/modules/admin-dashboard/presentation/scheduled-jobs/admin-scheduled-jobs-page';

const Page = async () => {
	const scheduledJobs = await getAdminScheduledJobs();

	return <AdminScheduledJobsPage scheduledJobs={scheduledJobs} />;
};

export default Page;
