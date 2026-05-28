import { Role } from '@packages/auth/roles/role';
import {
	TicketAccessDeniedError,
	TicketInvalidStatusTransitionError,
	TicketMessageOperationInvalidError,
} from './ticket.errors';

export enum TicketStatus {
	OPEN = 'OPEN',
	WAITING_USER = 'WAITING_USER',
	WAITING_SUPPORT = 'WAITING_SUPPORT',
	CLOSED = 'CLOSED',
}

export type TicketMessage = {
	id: string;
	ticketId: string;
	senderId: string;
	senderRole: Role;
	content: string;
	createdAt: Date;
};

const USER_ROLES = new Set<Role>([Role.CLIENT, Role.BOOSTER]);
const TICKET_STATUSES = new Set<string>(Object.values(TicketStatus));

export class Ticket {
	private constructor(
		public readonly id: string,
		public readonly userId: string,
		public readonly orderId: string | null,
		public readonly subject: string,
		private currentStatus: TicketStatus,
		public readonly createdAt: Date,
		private currentUpdatedAt: Date,
	) {}

	static create(input: {
		id?: string;
		userId: string;
		orderId?: string | null;
		subject: string;
		now: Date;
	}): Ticket {
		return new Ticket(
			input.id ?? '',
			input.userId,
			input.orderId ?? null,
			input.subject,
			TicketStatus.WAITING_SUPPORT,
			input.now,
			input.now,
		);
	}

	static rehydrate(input: {
		id: string;
		userId: string;
		orderId?: string | null;
		subject: string;
		status: TicketStatus | string;
		createdAt: Date;
		updatedAt: Date;
	}): Ticket {
		return new Ticket(
			input.id,
			input.userId,
			input.orderId ?? null,
			input.subject,
			ensureTicketStatus(input.status),
			input.createdAt,
			input.updatedAt,
		);
	}

	get status(): TicketStatus {
		return this.currentStatus;
	}

	get updatedAt(): Date {
		return this.currentUpdatedAt;
	}

	recordReply(input: { senderId: string; senderRole: Role; now: Date }): void {
		if (input.senderRole === Role.ADMIN) {
			this.currentStatus = TicketStatus.WAITING_USER;
			this.currentUpdatedAt = input.now;

			return;
		}

		if (!USER_ROLES.has(input.senderRole))
			throw new TicketMessageOperationInvalidError();
		if (input.senderId !== this.userId) throw new TicketAccessDeniedError();

		this.currentStatus = TicketStatus.WAITING_SUPPORT;
		this.currentUpdatedAt = input.now;
	}

	updateStatus(status: TicketStatus, now: Date): void {
		if (!TICKET_STATUSES.has(status))
			throw new TicketInvalidStatusTransitionError();
		this.currentStatus = status;
		this.currentUpdatedAt = now;
	}
}

export function ensureTicketStatus(value: TicketStatus | string): TicketStatus {
	if (TICKET_STATUSES.has(value)) return value as TicketStatus;

	throw new TicketInvalidStatusTransitionError();
}
