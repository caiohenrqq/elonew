import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/shared/ui/utils/cn';
import { getRankDivisionLabel, getRankOption } from '../model/rank-options';

type OrderRankRouteProps = {
	currentLeague: string | null;
	currentDivision: string | null;
	desiredLeague: string | null;
	desiredDivision: string | null;
	size?: 'sm' | 'md';
};

const imageSizes = { sm: 20, md: 36 };

const RankStep = ({
	league,
	division,
	size,
}: {
	league: string;
	division: string;
	size: 'sm' | 'md';
}) => {
	const rank = getRankOption(league);

	return (
		<span className="inline-flex items-center gap-1.5">
			<Image
				src={rank.image}
				alt={rank.label}
				width={imageSizes[size]}
				height={imageSizes[size]}
				className="shrink-0 object-contain"
			/>
			<span
				className={cn(
					'font-black uppercase tracking-wider',
					size === 'sm' ? 'text-xs' : 'text-sm',
				)}
				style={{ color: rank.accent }}
			>
				{rank.label} {getRankDivisionLabel(division)}
			</span>
		</span>
	);
};

export const OrderRankRoute = ({
	currentLeague,
	currentDivision,
	desiredLeague,
	desiredDivision,
	size = 'sm',
}: OrderRankRouteProps) => {
	if (
		!currentLeague ||
		!currentDivision ||
		!desiredLeague ||
		!desiredDivision
	) {
		return (
			<span className="text-xs font-bold text-white/40">Rota indisponível</span>
		);
	}

	return (
		<span className="inline-flex flex-wrap items-center gap-2">
			<RankStep league={currentLeague} division={currentDivision} size={size} />
			<ArrowRight className="h-3.5 w-3.5 shrink-0 text-white/25" />
			<RankStep league={desiredLeague} division={desiredDivision} size={size} />
		</span>
	);
};
