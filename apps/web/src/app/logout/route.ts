import { redirect } from 'next/navigation';
import { logout } from '@/modules/auth/server/auth-service';

export const GET = async () => {
	await logout();
	redirect('/login');
};
