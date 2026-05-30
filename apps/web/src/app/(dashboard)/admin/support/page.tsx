import { getAdminSupportWorkspace } from '@/modules/admin-dashboard/actions/admin-actions';
import { AdminSupportWorkspace } from '@/modules/admin-dashboard/presentation/support/admin-support-workspace';
import { adminTicketStatusSchema } from '@/modules/admin-dashboard/server/admin-contracts';

type PageProps = {
	searchParams?: Promise<{
		query?: string;
		status?: string;
		ticketId?: string;
	}>;
};

const Page = async ({ searchParams }: PageProps) => {
	const params = await searchParams;
	const status = adminTicketStatusSchema.safeParse(params?.status);
	const query = params?.query?.trim() || undefined;
	const ticketId = params?.ticketId?.trim() || undefined;
	const filters = {
		query,
		status: status.success ? status.data : undefined,
	};
	const workspace = await getAdminSupportWorkspace({
		...filters,
		ticketId,
	});

	return <AdminSupportWorkspace {...workspace} filters={filters} />;
};

export default Page;
