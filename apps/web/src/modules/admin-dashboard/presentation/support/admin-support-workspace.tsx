'use client';

import { Badge } from '@packages/ui/components/badge';
import { getButtonClassName } from '@packages/ui/components/button';
import { Card } from '@packages/ui/components/card';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@packages/ui/components/table';
import { fieldSurface, labelText } from '@packages/ui/styles/classes';
import { cn } from '@packages/ui/utils/cn';
import {
	ArrowRight,
	CheckCircle2,
	Clock3,
	MessageSquare,
	Search,
	Send,
	Ticket,
	UserRound,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useMemo, useRef } from 'react';
import { DashboardEmptyState } from '@/shared/dashboard/dashboard-empty-state';
import { DashboardEntrance } from '@/shared/dashboard/dashboard-entrance';
import { DashboardSectionHeader } from '@/shared/dashboard/dashboard-section-header';
import {
	replyAdminTicketAction,
	updateAdminTicketStatusAction,
} from '../../actions/admin-actions';
import type {
	AdminSupportTicketOutput,
	AdminTicketDetailOutput,
	AdminTicketStatus,
} from '../../server/admin-contracts';

type AdminSupportWorkspaceProps = {
	tickets: AdminSupportTicketOutput[];
	selectedTicket: AdminTicketDetailOutput | null;
	filters: {
		query?: string;
		status?: AdminTicketStatus;
	};
};

const ticketStatuses = [
	'WAITING_SUPPORT',
	'OPEN',
	'WAITING_USER',
	'CLOSED',
] as const satisfies readonly AdminTicketStatus[];

const ticketStatusLabels: Record<AdminTicketStatus, string> = {
	CLOSED: 'Fechado',
	OPEN: 'Aberto',
	WAITING_SUPPORT: 'Aguardando suporte',
	WAITING_USER: 'Aguardando usuário',
};

const ticketStatusDescriptions: Record<AdminTicketStatus, string> = {
	CLOSED: 'Encerrado',
	OPEN: 'Triagem',
	WAITING_SUPPORT: 'Responder',
	WAITING_USER: 'Com cliente',
};

const ticketStatusBadgeVariants: Record<
	AdminTicketStatus,
	'default' | 'outline' | 'success' | 'warning' | 'error'
> = {
	CLOSED: 'outline',
	OPEN: 'default',
	WAITING_SUPPORT: 'warning',
	WAITING_USER: 'success',
};

const roleLabels: Record<string, string> = {
	ADMIN: 'Admin',
	BOOSTER: 'Booster',
	CLIENT: 'Cliente',
};

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
	dateStyle: 'short',
	timeStyle: 'short',
});

const formatDate = (value: string | null) =>
	value ? dateTimeFormatter.format(new Date(value)) : 'Sem registro';

const buildSupportHref = (
	params: AdminSupportWorkspaceProps['filters'] & {
		ticketId?: string;
	},
) => {
	const searchParams = new URLSearchParams();
	if (params.status) searchParams.set('status', params.status);
	if (params.query) searchParams.set('query', params.query);
	if (params.ticketId) searchParams.set('ticketId', params.ticketId);
	const search = searchParams.toString();

	return search ? `/admin/support?${search}` : '/admin/support';
};

const sortTicketsByTriage = (tickets: AdminSupportTicketOutput[]) => {
	const priority = new Map<AdminTicketStatus, number>(
		ticketStatuses.map((status, index) => [status, index]),
	);

	return [...tickets].sort((first, second) => {
		const statusDiff =
			(priority.get(first.status) ?? 99) - (priority.get(second.status) ?? 99);
		if (statusDiff !== 0) return statusDiff;

		return (
			new Date(second.latestMessageAt ?? second.updatedAt).getTime() -
			new Date(first.latestMessageAt ?? first.updatedAt).getTime()
		);
	});
};

const TicketStatusBadge = ({ status }: { status: AdminTicketStatus }) => (
	<Badge variant={ticketStatusBadgeVariants[status]}>
		{ticketStatusLabels[status]}
	</Badge>
);

const SupportQueue = ({
	filters,
	selectedTicketId,
	tickets,
}: {
	filters: AdminSupportWorkspaceProps['filters'];
	selectedTicketId?: string;
	tickets: AdminSupportTicketOutput[];
}) => {
	const sortedTickets = useMemo(() => sortTicketsByTriage(tickets), [tickets]);

	return (
		<div className="space-y-3">
			<Card className="border-white/10 p-4">
				<form
					action="/admin/support"
					className="grid gap-2 sm:grid-cols-[1fr_auto]"
				>
					<input type="hidden" name="status" value={filters.status ?? ''} />
					<label className="sr-only" htmlFor="ticket-query">
						Buscar tickets
					</label>
					<div className="relative">
						<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-3.5 w-3.5 text-white/35" />
						<input
							id="ticket-query"
							name="query"
							defaultValue={filters.query ?? ''}
							placeholder="Buscar por assunto"
							className={cn(fieldSurface, 'pl-9')}
						/>
					</div>
					<button
						type="submit"
						className={getButtonClassName({
							variant: 'outline',
							size: 'icon',
							className: 'h-10 w-10',
						})}
						aria-label="Buscar tickets"
					>
						<Search className="h-3.5 w-3.5" />
					</button>
				</form>
				<div className="mt-3 flex flex-wrap gap-2">
					<Link
						href={buildSupportHref({ query: filters.query })}
						className={getButtonClassName({
							variant: filters.status ? 'outline' : 'secondary',
							size: 'sm',
							className: 'h-8 px-3 text-[9px]',
						})}
					>
						Todos
					</Link>
					{ticketStatuses.map((status) => (
						<Link
							key={status}
							href={buildSupportHref({ query: filters.query, status })}
							className={getButtonClassName({
								variant: filters.status === status ? 'secondary' : 'outline',
								size: 'sm',
								className: 'h-8 px-3 text-[9px]',
							})}
						>
							{ticketStatusDescriptions[status]}
						</Link>
					))}
				</div>
			</Card>
			<Card className="overflow-hidden border-white/10">
				{sortedTickets.length > 0 ? (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Chamado</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Usuário</TableHead>
								<TableHead>Pedido</TableHead>
								<TableHead>Mensagens</TableHead>
								<TableHead>Última mensagem</TableHead>
								<TableHead className="text-right">Atendimento</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{sortedTickets.map((ticket) => (
								<TableRow
									key={ticket.id}
									data-state={
										ticket.id === selectedTicketId ? 'selected' : undefined
									}
								>
									<TableCell>
										<div className="flex items-center gap-2.5">
											<Ticket className="h-4 w-4 shrink-0 text-hextech-cyan/70" />
											<div className="min-w-0 space-y-1">
												<p className="truncate font-black text-white">
													{ticket.subject}
												</p>
												<p className="max-w-[190px] truncate font-mono text-[10px] text-white/45">
													{ticket.id}
												</p>
											</div>
										</div>
									</TableCell>
									<TableCell>
										<TicketStatusBadge status={ticket.status} />
									</TableCell>
									<TableCell>
										<p className="text-[10px] uppercase tracking-widest text-white/35">
											{ticket.userId}
										</p>
									</TableCell>
									<TableCell>
										<p className="max-w-[190px] truncate font-mono text-[10px] text-white/45">
											{ticket.orderId ?? 'Não vinculado'}
										</p>
									</TableCell>
									<TableCell>
										<div className="flex items-center gap-2 text-[10px] font-bold text-white/45">
											<MessageSquare className="h-3.5 w-3.5 text-hextech-cyan/70" />
											{ticket.messageCount} mensagens
										</div>
									</TableCell>
									<TableCell className="text-[10px] uppercase tracking-widest text-white/35">
										{formatDate(ticket.latestMessageAt)}
									</TableCell>
									<TableCell className="text-right">
										<Link
											href={buildSupportHref({
												...filters,
												ticketId: ticket.id,
											})}
											aria-current={
												ticket.id === selectedTicketId ? 'page' : undefined
											}
											className={getButtonClassName({
												size: 'sm',
												variant: 'outline',
												className: 'gap-2',
											})}
										>
											Abrir
											<ArrowRight className="h-3.5 w-3.5" />
										</Link>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				) : (
					<div className="p-6">
						<DashboardEmptyState
							icon={Ticket}
							title="Nenhum ticket encontrado"
							description="Ajuste os filtros para revisar outros chamados."
						/>
					</div>
				)}
			</Card>
		</div>
	);
};

const ReplyForm = ({ ticketId }: { ticketId: string }) => {
	const router = useRouter();
	const formRef = useRef<HTMLFormElement>(null);
	const [state, formAction, isPending] = useActionState(
		replyAdminTicketAction,
		{},
	);

	useEffect(() => {
		if (!state.success) return;

		formRef.current?.reset();
		router.refresh();
	}, [router, state.success]);

	return (
		<form ref={formRef} action={formAction} className="grid gap-3">
			<input type="hidden" name="ticketId" value={ticketId} />
			<label className="sr-only" htmlFor="ticket-reply">
				Resposta
			</label>
			<textarea
				id="ticket-reply"
				name="content"
				placeholder="Responder ao ticket"
				className={cn(
					fieldSurface,
					'h-28 min-h-28 resize-none bg-black/20 leading-relaxed placeholder:text-white/30',
				)}
				disabled={isPending}
				required
			/>
			<div className="flex items-center justify-between gap-3">
				<p className="min-h-4 text-[10px] font-bold uppercase tracking-wider text-red-300">
					{state.error ?? ''}
				</p>
				<button
					type="submit"
					disabled={isPending}
					aria-busy={isPending}
					className={getButtonClassName({
						variant: 'secondary',
						size: 'sm',
						className: 'gap-2',
					})}
				>
					<Send className="h-3.5 w-3.5" />
					{isPending ? 'Enviando' : 'Responder'}
				</button>
			</div>
		</form>
	);
};

const StatusForm = ({
	status,
	ticketId,
}: {
	status: AdminTicketStatus;
	ticketId: string;
}) => {
	const router = useRouter();
	const [state, formAction, isPending] = useActionState(
		updateAdminTicketStatusAction,
		{},
	);

	useEffect(() => {
		if (state.success) router.refresh();
	}, [router, state.success]);

	return (
		<form action={formAction} className="grid gap-2 sm:grid-cols-[1fr_auto]">
			<input type="hidden" name="ticketId" value={ticketId} />
			<label className="sr-only" htmlFor="ticket-status">
				Status do ticket
			</label>
			<select
				id="ticket-status"
				name="status"
				defaultValue={status}
				disabled={isPending}
				className={cn(fieldSurface, 'cursor-pointer bg-black/20')}
			>
				{ticketStatuses.map((ticketStatus) => (
					<option key={ticketStatus} value={ticketStatus}>
						{ticketStatusLabels[ticketStatus]}
					</option>
				))}
			</select>
			<button
				type="submit"
				disabled={isPending}
				aria-busy={isPending}
				className={getButtonClassName({
					variant: 'outline',
					size: 'sm',
					className: 'gap-2',
				})}
			>
				<CheckCircle2 className="h-3.5 w-3.5" />
				{isPending ? 'Salvando' : 'Atualizar'}
			</button>
			<p className="min-h-4 text-[10px] font-bold uppercase tracking-wider text-red-300 sm:col-span-2">
				{state.error ?? ''}
			</p>
		</form>
	);
};

const TicketDetail = ({ ticket }: { ticket: AdminTicketDetailOutput }) => (
	<Card className="min-h-[640px] overflow-hidden border-white/10">
		<div className="border-b border-white/10 p-5">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
				<div className="min-w-0 space-y-3">
					<TicketStatusBadge status={ticket.status} />
					<h2 className="text-xl font-black text-white">{ticket.subject}</h2>
					<div className="flex flex-wrap gap-x-4 gap-y-2 text-[10px] font-bold uppercase tracking-wider text-white/35">
						<span className="inline-flex items-center gap-1.5">
							<UserRound className="h-3.5 w-3.5" />
							{ticket.userId}
						</span>
						<span>Pedido: {ticket.orderId ?? 'Não vinculado'}</span>
						<span>Criado em {formatDate(ticket.createdAt)}</span>
					</div>
				</div>
				<div className="w-full lg:w-72">
					<StatusForm ticketId={ticket.id} status={ticket.status} />
				</div>
			</div>
		</div>
		<div className="grid min-h-[420px] gap-0 lg:grid-cols-[1fr_320px]">
			<div className="border-white/10 border-b p-5 lg:border-r lg:border-b-0">
				<div className="mb-4 flex items-center justify-between gap-3">
					<p className={cn(labelText.control, 'text-white')}>Histórico</p>
					<p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/35">
						<MessageSquare className="h-3.5 w-3.5" />
						{ticket.messages.length} mensagens
					</p>
				</div>
				{ticket.messages.length > 0 ? (
					<div className="space-y-4">
						{ticket.messages.map((message) => {
							const isAdmin = message.senderRole === 'ADMIN';

							return (
								<article
									key={message.id}
									className={cn(
										'rounded-sm border p-4',
										isAdmin
											? 'border-hextech-cyan/20 bg-hextech-cyan/5'
											: 'border-white/10 bg-white/[0.03]',
									)}
								>
									<div className="mb-3 flex flex-wrap items-center justify-between gap-2">
										<p className="text-[10px] font-black uppercase tracking-[0.18em] text-white">
											{roleLabels[message.senderRole] ?? message.senderRole}
										</p>
										<p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/35">
											<Clock3 className="h-3.5 w-3.5" />
											{formatDate(message.createdAt)}
										</p>
									</div>
									<p className="whitespace-pre-wrap text-sm leading-relaxed text-white/75">
										{message.content}
									</p>
								</article>
							);
						})}
					</div>
				) : (
					<DashboardEmptyState
						icon={MessageSquare}
						title="Nenhuma mensagem"
						description="As mensagens deste ticket aparecerão aqui."
					/>
				)}
			</div>
			<aside className="space-y-5 p-5">
				<div className="space-y-2">
					<p className={cn(labelText.control, 'text-white')}>Resposta</p>
					<p className="text-xs leading-relaxed text-white/40">
						A resposta do admin move o ticket para aguardando usuário. Use o
						status manual para fechar ou reclassificar o atendimento.
					</p>
				</div>
				<ReplyForm ticketId={ticket.id} />
			</aside>
		</div>
	</Card>
);

export const AdminSupportWorkspace = ({
	filters,
	selectedTicket,
	tickets,
}: AdminSupportWorkspaceProps) => {
	const waitingSupportCount = tickets.filter(
		(ticket) => ticket.status === 'WAITING_SUPPORT',
	).length;

	return (
		<DashboardEntrance>
			<section className="dashboard-animate space-y-4">
				<DashboardSectionHeader
					title="Suporte"
					detail={`${waitingSupportCount} aguardando suporte`}
				/>
				<div className="space-y-4">
					<SupportQueue
						filters={filters}
						selectedTicketId={selectedTicket?.id}
						tickets={tickets}
					/>
					{selectedTicket ? (
						<TicketDetail ticket={selectedTicket} />
					) : (
						<Card className="flex min-h-[360px] items-center justify-center border-white/10 p-6">
							<DashboardEmptyState
								icon={Ticket}
								title="Selecione um ticket"
								description="Escolha um chamado na fila para revisar o histórico e responder."
							/>
						</Card>
					)}
				</div>
			</section>
		</DashboardEntrance>
	);
};
