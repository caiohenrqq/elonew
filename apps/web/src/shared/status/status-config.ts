import {
	CircleCheck,
	CircleDollarSign,
	CircleX,
	Clock,
	Hourglass,
	MessageSquare,
	Play,
	ShieldCheck,
	ShieldX,
} from 'lucide-react';
import type { ComponentType } from 'react';
import type { BadgeProps } from '../ui/components/badge';

type StatusConfig = {
	label: string;
	variant: NonNullable<BadgeProps['variant']>;
	icon: ComponentType<{ className?: string }>;
};

export const ORDER_STATUS_CONFIG: Record<string, StatusConfig> = {
	awaiting_payment: {
		label: 'Aguardando pagamento',
		variant: 'warning',
		icon: Clock,
	},
	pending_booster: {
		label: 'Aguardando booster',
		variant: 'warning',
		icon: Hourglass,
	},
	in_progress: { label: 'Em execução', variant: 'info', icon: Play },
	completed: { label: 'Finalizado', variant: 'success', icon: CircleCheck },
	cancelled: { label: 'Cancelado', variant: 'error', icon: CircleX },
	accepted: { label: 'Aceito', variant: 'info', icon: ShieldCheck },
	paid: { label: 'Pago', variant: 'success', icon: CircleDollarSign },
	rejected: { label: 'Recusado', variant: 'error', icon: ShieldX },
};

export const TICKET_STATUS_CONFIG: Record<string, StatusConfig> = {
	OPEN: { label: 'Aberto', variant: 'warning', icon: MessageSquare },
	PENDING: { label: 'Pendente', variant: 'default', icon: Clock },
	CLOSED: { label: 'Fechado', variant: 'success', icon: CircleCheck },
};
