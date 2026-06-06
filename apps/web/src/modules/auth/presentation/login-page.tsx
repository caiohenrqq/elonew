import { Suspense } from 'react';
import { isDevelopmentRuntime } from '@/shared/env/web-env';
import { LoginForm } from './login-form';

const LoginPage = () => {
	return (
		<Suspense>
			<LoginForm showDevLogin={isDevelopmentRuntime()} />
		</Suspense>
	);
};

export { LoginPage };
