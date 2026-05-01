import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { HTMLAttributes, PropsWithChildren } from 'react';
import { loginAction } from '@/modules/auth/actions/auth-actions';
import { LoginForm } from './login-form';

jest.mock('@/modules/auth/actions/auth-actions', () => ({
	loginAction: jest.fn(),
}));

jest.mock('@packages/ui/animation/gsap', () => ({
	gsap: {
		from: jest.fn(),
	},
	useGSAP: jest.fn(),
}));

jest.mock('motion/react', () => ({
	motion: {
		div: ({
			children,
			whileHover,
			whileTap,
			...props
		}: PropsWithChildren<
			HTMLAttributes<HTMLDivElement> & {
				whileHover?: unknown;
				whileTap?: unknown;
			}
		>) => <div {...props}>{children}</div>,
	},
}));

jest.mock('next/link', () => ({
	__esModule: true,
	default: ({
		children,
		href,
	}: {
		children: React.ReactNode;
		href: string;
	}) => <a href={href}>{children}</a>,
}));

describe('LoginForm', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should render login form fields', () => {
		render(<LoginForm />);

		expect(screen.getByLabelText(/E-mail/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/Senha/i)).toBeInTheDocument();
		expect(
			screen.getByRole('button', { name: /Entrar Agora/i }),
		).toBeInTheDocument();
	});

	it('should show validation errors for empty fields', async () => {
		render(<LoginForm />);

		fireEvent.click(screen.getByRole('button', { name: /Entrar Agora/i }));

		await waitFor(() => {});
	});

	it('should call loginAction on valid submit', async () => {
		(loginAction as jest.Mock).mockResolvedValue({ success: true });

		render(<LoginForm />);

		fireEvent.change(screen.getByLabelText(/E-mail/i), {
			target: { value: 'test@example.com' },
		});
		fireEvent.change(screen.getByLabelText(/Senha/i), {
			target: { value: 'password123' },
		});

		fireEvent.click(screen.getByRole('button', { name: /Entrar Agora/i }));

		await waitFor(() => {
			expect(loginAction).toHaveBeenCalledWith({
				email: 'test@example.com',
				password: 'password123',
			});
		});
	});

	it('should display error message from loginAction', async () => {
		(loginAction as jest.Mock).mockResolvedValue({
			error: 'Credenciais inválidas',
		});

		render(<LoginForm />);

		fireEvent.change(screen.getByLabelText(/E-mail/i), {
			target: { value: 'test@example.com' },
		});
		fireEvent.change(screen.getByLabelText(/Senha/i), {
			target: { value: 'wrong-password' },
		});

		fireEvent.click(screen.getByRole('button', { name: /Entrar Agora/i }));

		await waitFor(() => {
			expect(screen.getByText(/Credenciais inválidas/i)).toBeInTheDocument();
		});
	});
});
