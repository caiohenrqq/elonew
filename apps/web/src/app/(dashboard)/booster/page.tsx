import { parseBoosterDashboardTab } from '@/modules/booster-dashboard/model/booster-tabs';
import { BoosterDashboardPage } from '@/modules/booster-dashboard/presentation/overview/booster-dashboard-page';

type BoosterDashboardRouteProps = {
	searchParams?: Promise<{
		tab?: string;
	}>;
};

const BoosterDashboardRoute = async ({
	searchParams,
}: BoosterDashboardRouteProps) => {
	const params = await searchParams;
	return <BoosterDashboardPage tab={parseBoosterDashboardTab(params?.tab)} />;
};

export default BoosterDashboardRoute;
