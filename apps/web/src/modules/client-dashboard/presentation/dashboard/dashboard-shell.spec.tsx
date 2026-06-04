import { render, screen } from '@testing-library/react';
import { usePathname, useSearchParams } from 'next/navigation';
import type {
	AnchorHTMLAttributes,
	HTMLAttributes,
	PropsWithChildren,
	ReactNode,
} from 'react';
import { DashboardShell } from './dashboard-shell';

jest.mock('next/navigation', () => ({
	usePathname: jest.fn(),
	useSearchParams: jest.fn(),
}));

jest.mock('@/modules/auth/actions/auth-actions', () => ({
	logoutAction: jest.fn(),
}));

jest.mock('@/modules/notifications/actions/notification-actions', () => ({
	getDashboardNotifications: jest.fn().mockResolvedValue({
		items: [],
		nextCursor: null,
		unreadCount: 0,
	}),
}));

jest.mock('@/modules/notifications/presentation/notification-popover', () => ({
	NotificationPopover: () => <div data-testid="notification-popover" />,
}));

jest.mock('@/shared/ui/brand/glitch-logo', () => ({
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
		(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
	});

	const renderShell = async (children: ReactNode) => {
		render(
			await DashboardShell({
				user: mockUser,
				children,
			}),
		);
	};

	it('should render dashboard shell with user info', async () => {
		await renderShell(<div data-testid="children">Content</div>);

		expect(screen.getByText('TestUser')).toBeInTheDocument();
		expect(screen.getByTestId('glitch-logo')).toBeInTheDocument();
		expect(screen.getByTestId('notification-popover')).toBeInTheDocument();
		expect(screen.getByTestId('children')).toBeInTheDocument();
	});

	it('should highlight active sidebar item', async () => {
		(usePathname as jest.Mock).mockReturnValue('/client/orders/new');

		await renderShell(<div>Content</div>);

		const activeItem = screen.getByRole('link', { name: /Novo Pedido/i });
		expect(activeItem).toHaveAttribute('aria-current', 'page');
	});

	it('should render sidebar navigation items', async () => {
		await renderShell(<div>Content</div>);

		expect(screen.getByText('Visão geral')).toBeInTheDocument();
		expect(screen.getByText('Pedidos')).toBeInTheDocument();
		expect(screen.getByText('Tickets')).toBeInTheDocument();
		expect(screen.getByText('Novo Pedido')).toBeInTheDocument();
	});

	it('should have logout button', async () => {
		await renderShell(<div>Content</div>);

		expect(screen.getByRole('button', { name: /Sair/i })).toBeInTheDocument();
	});
});
