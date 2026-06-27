import { getAdminCoupons } from '@/modules/admin-dashboard/actions/coupon-actions';
import { AdminCouponsPage } from '@/modules/admin-dashboard/presentation/coupons/admin-coupons-page';

const Page = async () => {
	const coupons = await getAdminCoupons();

	return <AdminCouponsPage coupons={coupons} />;
};

export default Page;
