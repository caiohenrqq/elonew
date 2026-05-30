import type { ReactNode } from 'react';
import { Card } from '@/shared/ui/components/card';
import {
	Table,
	TableBody,
	TableCell,
	TableRow,
} from '@/shared/ui/components/table';
import { cn } from '@/shared/ui/utils/cn';

type DashboardTableSectionProps = {
	children: ReactNode;
	colSpan: number;
	emptyState: ReactNode;
	isEmpty: boolean;
	className?: string;
	header?: ReactNode;
	mobileContent?: ReactNode;
	scrollAreaTestId?: string;
};

export const DashboardTableSection = ({
	children,
	colSpan,
	emptyState,
	isEmpty,
	className,
	header,
	mobileContent,
	scrollAreaTestId,
}: DashboardTableSectionProps) => (
	<section
		className={cn(
			'dashboard-animate flex min-h-0 flex-1 flex-col space-y-4',
			className,
		)}
	>
		{header}
		<Card className="flex min-h-0 flex-1 flex-col overflow-hidden border-white/10">
			{mobileContent ? (
				<div className="grid gap-3 p-3 md:hidden">
					{isEmpty ? emptyState : mobileContent}
				</div>
			) : null}
			<div
				data-testid={scrollAreaTestId}
				className={cn(
					'flex-1 overflow-auto [&>div]:h-full',
					mobileContent && 'hidden md:block',
				)}
			>
				<Table
					className={isEmpty ? 'h-full' : undefined}
					wrapperClassName={isEmpty ? 'overflow-hidden' : undefined}
				>
					{isEmpty ? (
						<TableBody className="h-full">
							<TableRow className="h-full hover:bg-transparent">
								<TableCell colSpan={colSpan} className="h-full p-0">
									{emptyState}
								</TableCell>
							</TableRow>
						</TableBody>
					) : (
						children
					)}
				</Table>
			</div>
		</Card>
	</section>
);
