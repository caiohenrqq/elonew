import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from '@testing-library/react';
import { useRouter } from 'next/navigation';
import type { HTMLAttributes, PropsWithChildren } from 'react';
import { registerAction } from '@/features/auth/actions/auth-actions';
import { RegisterForm } from './register-form';

jest.mock('@/features/auth/actions/auth-actions', () => ({
	registerAction: jest.fn(),
}));

jest.mock('next/navigation', () => ({
	useRouter: jest.fn(),
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
			initial,
			animate,
			transition,
			layoutId,
			...props
		}: PropsWithChildren<
			HTMLAttributes<HTMLDivElement> & {
				animate?: unknown;
				initial?: unknown;
				layoutId?: string;
				transition?: unknown;
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
	}) => (
		<div whilehover="mock" whiletap="mock">
			<a href={href}>{children}</a>
		</div>
	),
}));

describe('RegisterForm', () => {
	const mockPush = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
		(useRouter as jest.Mock).mockReturnValue({
			push: mockPush,
		});
	});

	it('should render register form fields', () => {
		render(<RegisterForm />);

		expect(screen.getByLabelText(/Nome de usuário/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/E-mail/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/Senha/i)).toBeInTheDocument();
		expect(screen.getByText(/Eu li e aceito os/i)).toBeInTheDocument();
		expect(
			screen.getByRole('button', { name: /Finalizar Cadastro/i }),
		).toBeInTheDocument();
	});

	it('should call registerAction on valid submit', async () => {
		(registerAction as jest.Mock).mockResolvedValue({ success: true });

		render(<RegisterForm />);

		fireEvent.change(screen.getByLabelText(/Nome de usuário/i), {
			target: { value: 'tester' },
		});
		fireEvent.change(screen.getByLabelText(/E-mail/i), {
			target: { value: 'test@example.com' },
		});
		fireEvent.change(screen.getByLabelText(/Senha/i), {
			target: { value: 'password12345' },
		});

		const checkbox = screen.getByRole('checkbox');
		fireEvent.click(checkbox);

		fireEvent.click(
			screen.getByRole('button', { name: /Finalizar Cadastro/i }),
		);

		await waitFor(() => {
			expect(registerAction).toHaveBeenCalledWith({
				username: 'tester',
				email: 'test@example.com',
				password: 'password12345',
				termsAccepted: true,
			});
		});
	});

	it('should display success message and redirect after success', async () => {
		jest.useFakeTimers();
		(registerAction as jest.Mock).mockResolvedValue({ success: true });

		render(<RegisterForm />);

		fireEvent.change(screen.getByLabelText(/Nome de usuário/i), {
			target: { value: 'tester' },
		});
		fireEvent.change(screen.getByLabelText(/E-mail/i), {
			target: { value: 'test@example.com' },
		});
		fireEvent.change(screen.getByLabelText(/Senha/i), {
			target: { value: 'password12345' },
		});
		fireEvent.click(screen.getByRole('checkbox'));
		fireEvent.click(
			screen.getByRole('button', { name: /Finalizar Cadastro/i }),
		);

		await waitFor(() => {
			expect(screen.getByText(/Cadastro Realizado!/i)).toBeInTheDocument();
		});

		act(() => {
			jest.advanceTimersByTime(3000);
		});
		expect(mockPush).toHaveBeenCalledWith('/login');

		jest.useRealTimers();
	});

	it('should not redirect after unmounting the success state', async () => {
		jest.useFakeTimers();
		(registerAction as jest.Mock).mockResolvedValue({ success: true });

		const { unmount } = render(<RegisterForm />);

		fireEvent.change(screen.getByLabelText(/Nome de usuário/i), {
			target: { value: 'tester' },
		});
		fireEvent.change(screen.getByLabelText(/E-mail/i), {
			target: { value: 'test@example.com' },
		});
		fireEvent.change(screen.getByLabelText(/Senha/i), {
			target: { value: 'password12345' },
		});
		fireEvent.click(screen.getByRole('checkbox'));
		fireEvent.click(
			screen.getByRole('button', { name: /Finalizar Cadastro/i }),
		);

		await waitFor(() => {
			expect(screen.getByText(/Cadastro Realizado!/i)).toBeInTheDocument();
		});

		unmount();

		act(() => {
			jest.advanceTimersByTime(3000);
		});
		expect(mockPush).not.toHaveBeenCalled();

		jest.useRealTimers();
	});

	it('should display error message from registerAction', async () => {
		(registerAction as jest.Mock).mockResolvedValue({
			error: 'E-mail já cadastrado',
		});

		render(<RegisterForm />);

		fireEvent.change(screen.getByLabelText(/Nome de usuário/i), {
			target: { value: 'tester' },
		});
		fireEvent.change(screen.getByLabelText(/E-mail/i), {
			target: { value: 'test@example.com' },
		});
		fireEvent.change(screen.getByLabelText(/Senha/i), {
			target: { value: 'password12345' },
		});
		fireEvent.click(screen.getByRole('checkbox'));
		fireEvent.click(
			screen.getByRole('button', { name: /Finalizar Cadastro/i }),
		);

		await waitFor(() => {
			expect(screen.getByText(/E-mail já cadastrado/i)).toBeInTheDocument();
		});
	});
});
