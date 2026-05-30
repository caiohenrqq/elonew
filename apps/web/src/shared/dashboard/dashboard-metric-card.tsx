import type { ElementType, ReactNode } from 'react';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/shared/ui/components/card';
import { cn } from '@/shared/ui/utils/cn';

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
				'group relative overflow-hidden transition-colors duration-200 h-full',
				'hover:border-hextech-cyan/40',
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
		</Card>
	);
};
