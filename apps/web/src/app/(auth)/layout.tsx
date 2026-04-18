import type { ReactNode } from 'react';
import { AuthShell } from '@/modules/auth/presentation/auth-shell';

const AuthLayout = ({ children }: { children: ReactNode }) => {
	return <AuthShell>{children}</AuthShell>;
};

export default AuthLayout;
