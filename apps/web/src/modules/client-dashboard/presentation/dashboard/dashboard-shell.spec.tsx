import { render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import type {
	AnchorHTMLAttributes,
	HTMLAttributes,
	PropsWithChildren,
} from 'react';
import { DashboardShell } from './dashboard-shell';

jest.mock('next/navigation', () => ({
	usePathname: jest.fn(),
}));

jest.mock('@/modules/auth/actions/auth-actions', () => ({
	logoutAction: jest.fn(),
}));

jest.mock('@packages/ui/brand/glitch-logo', () => ({
	GlitchLogo: () => <div data-testid="glitch-logo" />,
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
		...props
	}: PropsWithChildren<
		AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }
	>) => (
		<a href={href} {...props}>
			{children}
		</a>
	),
}));

describe('DashboardShell', () => {
	const mockUser = { username: 'TestUser' };

	beforeEach(() => {
		jest.clearAllMocks();
		(usePathname as jest.Mock).mockReturnValue('/client');
	});

	it('should render dashboard shell with user info', () => {
		render(
			<DashboardShell user={mockUser}>
				<div data-testid="children">Content</div>
			</DashboardShell>,
		);

		expect(screen.getByText('TestUser')).toBeInTheDocument();
		expect(screen.getByTestId('glitch-logo')).toBeInTheDocument();
		expect(screen.getByTestId('children')).toBeInTheDocument();
	});

	it('should highlight active sidebar item', () => {
		(usePathname as jest.Mock).mockReturnValue('/client/orders/new');

		render(
			<DashboardShell user={mockUser}>
				<div>Content</div>
			</DashboardShell>,
		);

		const activeItem = screen.getByRole('link', { name: /Novo Pedido/i });
		expect(activeItem).toHaveAttribute('aria-current', 'page');
	});

	it('should render sidebar navigation items', () => {
		render(
			<DashboardShell user={mockUser}>
				<div>Content</div>
			</DashboardShell>,
		);

		expect(screen.getByText('Painel')).toBeInTheDocument();
		expect(screen.getByText('Novo Pedido')).toBeInTheDocument();
	});

	it('should have logout button', () => {
		render(
			<DashboardShell user={mockUser}>
				<div>Content</div>
			</DashboardShell>,
		);

		expect(screen.getByRole('button', { name: /Sair/i })).toBeInTheDocument();
	});
});
