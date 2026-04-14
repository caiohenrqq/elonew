import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@packages/ui/components/card';
import type { ReactNode } from 'react';

type MetricCardProps = {
	children: ReactNode;
	label: string;
	value: string;
};

export const MetricCard = ({ children, label, value }: MetricCardProps) => (
	<Card className="group hover:border-hextech-cyan/40 transition-all duration-500 hover:shadow-[0_0_20px_rgba(14,165,233,0.1)] relative overflow-hidden">
		<CardHeader className="pb-2">
			<CardDescription className="group-hover:text-hextech-cyan/70 transition-colors">
				{label}
			</CardDescription>
			<CardTitle className="text-2xl font-black tracking-tight group-hover:text-white transition-colors">
				{value}
			</CardTitle>
		</CardHeader>
		<CardContent>{children}</CardContent>
		<div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-hextech-cyan/50 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />
	</Card>
);
