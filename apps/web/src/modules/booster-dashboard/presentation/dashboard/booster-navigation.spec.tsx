import { render, screen } from '@testing-library/react';
import { usePathname, useSearchParams } from 'next/navigation';
import type {
	AnchorHTMLAttributes,
	HTMLAttributes,
	PropsWithChildren,
} from 'react';
import { BoosterNavigation } from './booster-navigation';

jest.mock('next/navigation', () => ({
	usePathname: jest.fn(),
	useSearchParams: jest.fn(),
}));

jest.mock('motion/react', () => ({
	motion: {
		div: ({
			children,
			layoutId,
			transition,
			...props
		}: PropsWithChildren<
			HTMLAttributes<HTMLDivElement> & {
				layoutId?: string;
				transition?: unknown;
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

jest.mock('lucide-react', () => ({
	BriefcaseBusiness: () => <svg data-testid="work-icon" />,
	LayoutDashboard: () => <svg data-testid="queue-icon" />,
}));

const mockSearchParams = (tab?: string) => {
	jest.mocked(useSearchParams).mockReturnValue({
		get: (key: string) => (key === 'tab' ? (tab ?? null) : null),
	} as ReturnType<typeof useSearchParams>);
};

describe('BoosterNavigation', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.mocked(usePathname).mockReturnValue('/booster');
		mockSearchParams(undefined);
	});

	it('defaults the active tab to queue', () => {
		render(<BoosterNavigation />);

		expect(screen.getByRole('link', { name: /Fila/i })).toHaveAttribute(
			'aria-current',
			'page',
		);
		expect(screen.getByRole('link', { name: /Trabalho/i })).not.toHaveAttribute(
			'aria-current',
		);
	});

	it('marks work active when the query tab is work', () => {
		mockSearchParams('work');

		render(<BoosterNavigation />);

		expect(screen.getByRole('link', { name: /Trabalho/i })).toHaveAttribute(
			'aria-current',
			'page',
		);
		expect(screen.getByRole('link', { name: /Fila/i })).not.toHaveAttribute(
			'aria-current',
		);
	});
});
