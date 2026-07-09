import {
	ORDER_STATUS_CONFIG,
	TICKET_STATUS_CONFIG,
} from '@/shared/status/status-config';
import { cn } from '../utils/cn';
import { Badge } from './badge';

const ORDER_BADGE_WIDTH = 'min-w-50 justify-start';
const TICKET_BADGE_WIDTH = 'min-w-32 justify-start';

export const OrderStatusBadge = ({
	className,
	status,
}: {
	className?: string;
	status: string;
}) => {
	const config = ORDER_STATUS_CONFIG[status];
	if (!config)
		throw new Error(
			`[OrderStatusBadge] Unknown order status "${status}". Add it to ORDER_STATUS_CONFIG in shared/status/status-config.ts before using it.`,
		);
	return (
		<Badge
			variant={config.variant}
			icon={config.icon}
			className={cn(ORDER_BADGE_WIDTH, className)}
		>
			{config.label}
		</Badge>
	);
};

export const TicketStatusBadge = ({ status }: { status: string }) => {
	const config = TICKET_STATUS_CONFIG[status];
	if (!config)
		throw new Error(
			`[TicketStatusBadge] Unknown ticket status "${status}". Add it to TICKET_STATUS_CONFIG in shared/status/status-config.ts before using it.`,
		);
	return (
		<Badge
			variant={config.variant}
			icon={config.icon}
			className={TICKET_BADGE_WIDTH}
		>
			{config.label}
		</Badge>
	);
};
