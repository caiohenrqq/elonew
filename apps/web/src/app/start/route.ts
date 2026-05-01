import { redirect } from 'next/navigation';
import { getAuthSession } from '@/shared/auth/session';

export async function GET() {
	const session = await getAuthSession();

	if (session) {
		redirect('/client');
	}

	redirect('/register');
}
