import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@packages/ui/components/card';
import { cn } from '@packages/ui/utils/cn';
import type { ElementType, ReactNode } from 'react';

type DashboardMetricCardProps = {
	children?: ReactNode;
	icon?: ElementType;
	label: string;
	value: string;
};

export const DashboardMetricCard = ({
	children,
	icon: Icon,
	label,
	value,
}: DashboardMetricCardProps) => {
	return (
		<Card
			className={cn(
				'group relative overflow-hidden transition-all duration-500',
				'hover:border-hextech-cyan/40 hover:shadow-[0_0_20px_rgba(14,165,233,0.1)]',
			)}
		>
			<CardHeader className="pb-2">
				<div className="flex items-center justify-between gap-4">
					<CardDescription className="transition-colors group-hover:text-hextech-cyan/70">
						{label}
					</CardDescription>
					{Icon ? <Icon className="h-4 w-4 text-hextech-cyan/70" /> : null}
				</div>
				<CardTitle className="text-2xl font-black tracking-tight transition-colors group-hover:text-white">
					{value}
				</CardTitle>
			</CardHeader>
			{children ? <CardContent>{children}</CardContent> : null}
			<div
				className={cn(
					'absolute bottom-0 left-0 h-px w-full origin-center scale-x-0 bg-gradient-to-r from-transparent to-transparent transition-transform duration-700 group-hover:scale-x-100',
					'via-hextech-cyan/50',
				)}
			/>
		</Card>
	);
};
