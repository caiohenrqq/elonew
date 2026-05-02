import { redirect } from 'next/navigation';
import { getAuthSession } from '@/shared/auth/session';

export async function GET() {
	const session = await getAuthSession();

	if (session) {
		if (session.userRole === 'BOOSTER') redirect('/booster');
		if (session.userRole === 'ADMIN') redirect('/');
		redirect('/client');
	}

	redirect('/register');
}
