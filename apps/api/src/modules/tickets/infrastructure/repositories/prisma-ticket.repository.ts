import { PrismaService } from '@app/common/prisma/prisma.service';
import type {
	TicketDetailRecord,
	TicketRepositoryPort,
	TicketSummaryRecord,
} from '@modules/tickets/application/ports/ticket-repository.port';
import {
	ensureTicketStatus,
	type Ticket,
	type TicketMessage,
	TicketStatus,
} from '@modules/tickets/domain/ticket.entity';
import { Injectable } from '@nestjs/common';
import { Role } from '@packages/auth/roles/role';
import { ensurePersistedEnum } from '@packages/shared/utils/enum.utils';

type TicketMessageRecord = {
	id: string;
	ticketId: string;
	senderId: string;
	content: string;
	createdAt: Date;
	sender: {
		role: string;
	};
};

type TicketRecord = {
	id: string;
	userId: string;
	orderId: string | null;
	subject: string;
	status: string;
	createdAt: Date;
	updatedAt: Date;
	messages: TicketMessageRecord[];
};

type TicketSummaryPrismaRecord = Omit<TicketRecord, 'messages'> & {
	messages: Array<{ createdAt: Date }>;
	_count: { messages: number };
};

type TicketPrismaClient = {
	order: {
		findFirst(args: {
			where: { id: string; clientId: string };
			select: { id: true };
		}): Promise<{ id: string } | null>;
	};
	ticket: {
		create(args: {
			data: {
				userId: string;
				orderId: string | null;
				subject: string;
				status: string;
				createdAt: Date;
				updatedAt: Date;
				messages: {
					create: {
						senderId: string;
						content: string;
						createdAt: Date;
					};
				};
			};
			include: TicketDetailInclude;
		}): Promise<TicketRecord>;
		findMany(args: {
			where:
				| { userId: string }
				| {
						status?: string;
						OR?: Array<
							| { subject: { contains: string; mode: 'insensitive' } }
							| {
									user: { username: { contains: string; mode: 'insensitive' } };
							  }
							| { user: { email: { contains: string; mode: 'insensitive' } } }
						>;
				  };
			select: TicketSummarySelect;
			orderBy: { updatedAt: 'desc' };
			take: number;
		}): Promise<TicketSummaryPrismaRecord[]>;
		findUnique(args: {
			where: { id: string };
			include: TicketDetailInclude;
		}): Promise<TicketRecord | null>;
		update(args: {
			where: { id: string };
			data: {
				status: string;
				updatedAt: Date;
				messages?: {
					create: {
						senderId: string;
						content: string;
						createdAt: Date;
					};
				};
			};
			include: TicketDetailInclude;
		}): Promise<TicketRecord>;
	};
	$transaction<T>(
		fn: (transaction: TicketPrismaClient) => Promise<T>,
	): Promise<T>;
};

type TicketDetailInclude = {
	messages: {
		orderBy: [{ createdAt: 'asc' }, { id: 'asc' }];
		include: {
			sender: {
				select: { role: true };
			};
		};
	};
};

type TicketSummarySelect = {
	id: true;
	userId: true;
	orderId: true;
	subject: true;
	status: true;
	createdAt: true;
	updatedAt: true;
	messages: {
		select: { createdAt: true };
		orderBy: { createdAt: 'desc' };
		take: 1;
	};
	_count: { select: { messages: true } };
};

const ticketDetailInclude = {
	messages: {
		orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
		include: {
			sender: {
				select: { role: true },
			},
		},
	},
} satisfies TicketDetailInclude;

const ticketSummarySelect = {
	id: true,
	userId: true,
	orderId: true,
	subject: true,
	status: true,
	createdAt: true,
	updatedAt: true,
	messages: {
		select: { createdAt: true },
		orderBy: { createdAt: 'desc' },
		take: 1,
	},
	_count: { select: { messages: true } },
} satisfies TicketSummarySelect;

@Injectable()
export class PrismaTicketRepository implements TicketRepositoryPort {
	constructor(private readonly prisma: PrismaService) {}

	async isClientOrderOwner(input: {
		orderId: string;
		clientId: string;
	}): Promise<boolean> {
		const order = await this.getClient().order.findFirst({
			where: {
				id: input.orderId,
				clientId: input.clientId,
			},
			select: { id: true },
		});

		return Boolean(order);
	}

	async createWithInitialMessage(input: {
		userId: string;
		userRole: Role;
		orderId: string | null;
		subject: string;
		content: string;
		now: Date;
	}): Promise<TicketDetailRecord> {
		const record = await this.getClient().ticket.create({
			data: {
				userId: input.userId,
				orderId: input.orderId,
				subject: input.subject,
				status: TicketStatus.WAITING_SUPPORT,
				createdAt: input.now,
				updatedAt: input.now,
				messages: {
					create: {
						senderId: input.userId,
						content: input.content,
						createdAt: input.now,
					},
				},
			},
			include: ticketDetailInclude,
		});

		return this.mapDetail(record);
	}

	async listForUser(input: {
		userId: string;
		limit: number;
	}): Promise<TicketSummaryRecord[]> {
		const records = await this.getClient().ticket.findMany({
			where: { userId: input.userId },
			select: ticketSummarySelect,
			orderBy: { updatedAt: 'desc' },
			take: input.limit,
		});

		return records.map((record) => this.mapSummary(record));
	}

	async listForAdmin(input: {
		limit: number;
		status?: TicketStatus;
		query?: string;
	}): Promise<TicketSummaryRecord[]> {
		const query = input.query?.trim();
		const records = await this.getClient().ticket.findMany({
			where: {
				...(input.status ? { status: input.status } : {}),
				...(query
					? {
							OR: [
								{ subject: { contains: query, mode: 'insensitive' } },
								{
									user: {
										username: { contains: query, mode: 'insensitive' },
									},
								},
								{
									user: {
										email: { contains: query, mode: 'insensitive' },
									},
								},
							],
						}
					: {}),
			},
			select: ticketSummarySelect,
			orderBy: { updatedAt: 'desc' },
			take: input.limit,
		});

		return records.map((record) => this.mapSummary(record));
	}

	async findById(ticketId: string): Promise<TicketDetailRecord | null> {
		const record = await this.getClient().ticket.findUnique({
			where: { id: ticketId },
			include: ticketDetailInclude,
		});
		if (!record) return null;

		return this.mapDetail(record);
	}

	async addMessage(input: {
		ticket: Ticket;
		senderId: string;
		content: string;
		now: Date;
	}): Promise<TicketDetailRecord> {
		const record = await this.getClient().ticket.update({
			where: { id: input.ticket.id },
			data: {
				status: input.ticket.status,
				updatedAt: input.ticket.updatedAt,
				messages: {
					create: {
						senderId: input.senderId,
						content: input.content,
						createdAt: input.now,
					},
				},
			},
			include: ticketDetailInclude,
		});

		return this.mapDetail(record);
	}

	async updateStatus(input: {
		ticket: Ticket;
		status: TicketStatus;
		now: Date;
	}): Promise<TicketDetailRecord> {
		const record = await this.getClient().ticket.update({
			where: { id: input.ticket.id },
			data: {
				status: input.status,
				updatedAt: input.now,
			},
			include: ticketDetailInclude,
		});

		return this.mapDetail(record);
	}

	private mapDetail(record: TicketRecord): TicketDetailRecord {
		return {
			id: record.id,
			userId: record.userId,
			orderId: record.orderId,
			subject: record.subject,
			status: ensureTicketStatus(record.status),
			createdAt: record.createdAt,
			updatedAt: record.updatedAt,
			messages: record.messages.map((message) => this.mapMessage(message)),
		};
	}

	private mapSummary(record: TicketSummaryPrismaRecord): TicketSummaryRecord {
		return {
			id: record.id,
			userId: record.userId,
			orderId: record.orderId,
			subject: record.subject,
			status: ensureTicketStatus(record.status),
			createdAt: record.createdAt,
			updatedAt: record.updatedAt,
			messageCount: record._count.messages,
			latestMessageAt: record.messages[0]?.createdAt ?? null,
		};
	}

	private mapMessage(message: TicketMessageRecord): TicketMessage {
		return {
			id: message.id,
			ticketId: message.ticketId,
			senderId: message.senderId,
			senderRole: ensurePersistedEnum(Role, message.sender.role, 'user role'),
			content: message.content,
			createdAt: message.createdAt,
		};
	}

	private getClient(): TicketPrismaClient {
		return this.prisma as unknown as TicketPrismaClient;
	}
}
