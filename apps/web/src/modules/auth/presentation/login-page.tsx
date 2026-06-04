import { isDevelopmentRuntime } from '@/shared/env/web-env';
import { LoginForm } from './login-form';

const LoginPage = () => {
	return <LoginForm showDevLogin={isDevelopmentRuntime()} />;
};

export { LoginPage };
