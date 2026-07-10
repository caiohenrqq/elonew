'use client';

import { Ellipsis, MailPlus, UserPlus, Users, X } from 'lucide-react';
import { useActionState, useEffect, useId, useState } from 'react';
import { DashboardEmptyState } from '@/shared/dashboard/dashboard-empty-state';
import { DashboardTableSection } from '@/shared/dashboard/dashboard-table-section';
import { formatDateTime } from '@/shared/format/date';
import { Badge } from '@/shared/ui/components/badge';
import { getButtonClassName } from '@/shared/ui/components/button';
import { Modal } from '@/shared/ui/components/modal';
import {
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/shared/ui/components/table';
import { fieldSurface } from '@/shared/ui/styles/classes';
import { cn } from '@/shared/ui/utils/cn';
import {
	blockAdminUserAction,
	changeAdminUserRoleAction,
	renameAdminUserAction,
	resendAdminUserPasswordSetupAction,
	unblockAdminUserAction,
} from '../../actions/admin-actions';
import type { AdminUserOutput } from '../../server/admin-contracts';
import { AdminCreateUserForm } from '../overview/admin-create-user-form';
import { roleLabels, roleOptions } from './admin-user-metadata';

const effectiveStatus = (user: AdminUserOutput) => {
	if (user.isBlocked) return { label: 'Bloqueado', variant: 'error' as const };
	if (user.activationStatus === 'PENDING_ACTIVATION')
		return { label: 'Pendente', variant: 'warning' as const };
	if (user.activationStatus === 'INACTIVE')
		return { label: 'Inativo', variant: 'outline' as const };
	return { label: 'Ativo', variant: 'success' as const };
};

type ActionKind = 'rename' | 'role' | 'block' | null;

const UserActions = ({
	user,
	currentAdminId,
}: {
	user: AdminUserOutput;
	currentAdminId?: string;
}) => {
	const [menuOpen, setMenuOpen] = useState(false);
	const [kind, setKind] = useState<ActionKind>(null);
	const titleId = useId();
	const [renameState, renameAction, renamePending] = useActionState(
		renameAdminUserAction,
		{},
	);
	const [roleState, roleAction, rolePending] = useActionState(
		changeAdminUserRoleAction,
		{},
	);
	const governanceAction = user.isBlocked
		? unblockAdminUserAction
		: blockAdminUserAction;
	const [blockState, blockAction, blockPending] = useActionState(
		governanceAction,
		{},
	);
	const [resendState, resendAction, resendPending] = useActionState(
		resendAdminUserPasswordSetupAction,
		{},
	);

	useEffect(() => {
		if (renameState.success || roleState.success || blockState.success)
			setKind(null);
	}, [renameState.success, roleState.success, blockState.success]);

	const open = (next: Exclude<ActionKind, null>) => {
		setMenuOpen(false);
		setKind(next);
	};

	return (
		<div className="relative flex justify-end">
			<button
				type="button"
				aria-label={`Mais ações para ${user.username}`}
				aria-haspopup="menu"
				aria-expanded={menuOpen}
				onClick={() => setMenuOpen((value) => !value)}
				className={getButtonClassName({ variant: 'ghost', size: 'icon' })}
			>
				<Ellipsis className="h-4 w-4" />
			</button>
			{menuOpen ? (
				<div
					role="menu"
					className="absolute top-10 right-0 z-30 grid w-52 rounded-sm border border-white/10 bg-background p-1 shadow-xl"
				>
					<button
						role="menuitem"
						type="button"
						onClick={() => open('rename')}
						className="rounded-sm px-3 py-2 text-left text-xs text-white/75 hover:bg-white/5 hover:text-white"
					>
						Renomear
					</button>
					<button
						role="menuitem"
						type="button"
						disabled={user.id === currentAdminId}
						onClick={() => open('role')}
						className="rounded-sm px-3 py-2 text-left text-xs text-white/75 hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
					>
						Alterar tipo de conta
					</button>
					<button
						role="menuitem"
						type="button"
						disabled={user.id === currentAdminId}
						onClick={() => open('block')}
						className="rounded-sm px-3 py-2 text-left text-xs text-white/75 hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
					>
						{user.isBlocked ? 'Desbloquear' : 'Bloquear'}
					</button>
					{user.activationStatus === 'PENDING_ACTIVATION' ? (
						<form action={resendAction}>
							<input type="hidden" name="targetId" value={user.id} />
							<button
								role="menuitem"
								type="submit"
								disabled={resendPending}
								className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-xs text-white/75 hover:bg-white/5 hover:text-white"
							>
								<MailPlus className="h-3.5 w-3.5" />
								{resendPending ? 'Reenviando' : 'Reenviar acesso'}
							</button>
							{resendState.error ? (
								<p className="px-3 py-1 text-[10px] text-red-300">
									{resendState.error}
								</p>
							) : null}
						</form>
					) : null}
				</div>
			) : null}

			{kind ? (
				<Modal labelledBy={titleId} onClose={() => setKind(null)}>
						<div className="mb-4 flex items-start justify-between gap-4">
							<div>
								<h2 id={titleId} className="text-sm font-black text-white">
									{kind === 'rename'
										? 'Renomear usuário'
										: kind === 'role'
											? 'Alterar tipo de conta'
											: user.isBlocked
												? 'Desbloquear usuário'
												: 'Bloquear usuário'}
								</h2>
								<p className="mt-1 text-xs text-white/45">
									{user.username} · {user.email}
								</p>
							</div>
							<button
								type="button"
								aria-label="Fechar"
								onClick={() => setKind(null)}
								className={getButtonClassName({
									variant: 'ghost',
									size: 'icon',
								})}
							>
								<X className="h-4 w-4" />
							</button>
						</div>
						{kind === 'rename' ? (
							<form action={renameAction} className="grid gap-3">
								<input type="hidden" name="targetId" value={user.id} />
								<label className="grid gap-2 text-xs text-white/60">
									Nome de usuário
									<input
										name="username"
										defaultValue={user.username}
										required
										maxLength={120}
										className={cn(fieldSurface, 'bg-black/20')}
									/>
								</label>
								<ActionFooter
									pending={renamePending}
									error={renameState.error}
									label="Salvar nome"
									close={() => setKind(null)}
								/>
							</form>
						) : kind === 'role' ? (
							<form action={roleAction} className="grid gap-3">
								<input type="hidden" name="targetId" value={user.id} />
								<p className="rounded-sm border border-amber-300/20 bg-amber-300/5 p-3 text-xs leading-relaxed text-amber-100/75">
									Esta alteração troca as permissões de{' '}
									<strong>{roleLabels[user.role]}</strong> e encerra as sessões
									atuais. Pedidos e saldo existentes não serão alterados.
								</p>
								<label className="grid gap-2 text-xs text-white/60">
									Novo tipo
									<select
										name="role"
										defaultValue={user.role}
										className={cn(fieldSurface, 'bg-black/20')}
									>
										{roleOptions.map((option) => (
											<option key={option.value} value={option.value}>
												{option.label}
											</option>
										))}
									</select>
								</label>
								<ActionFooter
									pending={rolePending}
									error={roleState.error}
									label="Confirmar alteração"
									close={() => setKind(null)}
								/>
							</form>
						) : (
							<form action={blockAction} className="grid gap-3">
								<input type="hidden" name="targetId" value={user.id} />
								<label className="grid gap-2 text-xs text-white/60">
									Motivo
									<textarea
										name="reason"
										required
										className={cn(fieldSurface, 'h-24 resize-none bg-black/20')}
									/>
								</label>
								<ActionFooter
									pending={blockPending}
									error={blockState.error}
									label={user.isBlocked ? 'Desbloquear' : 'Bloquear'}
									close={() => setKind(null)}
								/>
							</form>
						)}
				</Modal>
			) : null}
		</div>
	);
};

const ActionFooter = ({
	pending,
	error,
	label,
	close,
}: {
	pending: boolean;
	error?: string;
	label: string;
	close: () => void;
}) => (
	<>
		<p className="min-h-4 text-[10px] text-red-300">{error ?? ''}</p>
		<div className="flex justify-end gap-2">
			<button
				type="button"
				onClick={close}
				className={getButtonClassName({ variant: 'outline', size: 'sm' })}
			>
				Cancelar
			</button>
			<button
				type="submit"
				disabled={pending}
				className={getButtonClassName({ variant: 'secondary', size: 'sm' })}
			>
				{pending ? 'Salvando' : label}
			</button>
		</div>
	</>
);

const UserCard = ({
	user,
	currentAdminId,
}: {
	user: AdminUserOutput;
	currentAdminId?: string;
}) => {
	const status = effectiveStatus(user);
	return (
		<article className="rounded-sm border border-white/10 bg-white/[0.02] p-4">
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0">
					<p className="truncate text-sm font-black text-white">
						{user.username}
					</p>
					<p className="mt-1 truncate text-xs text-white/45">{user.email}</p>
				</div>
				<UserActions user={user} currentAdminId={currentAdminId} />
			</div>
			<div className="mt-4 flex items-center justify-between border-white/5 border-t pt-3">
				<Badge>{roleLabels[user.role] ?? user.role}</Badge>
				<Badge variant={status.variant}>{status.label}</Badge>
			</div>
		</article>
	);
};

export const AdminUsersTable = ({
	users,
	currentAdminId,
}: {
	users: AdminUserOutput[];
	currentAdminId?: string;
}) => (
	<DashboardTableSection
		isEmpty={users.length === 0}
		colSpan={5}
		mobileContent={users.map((user) => (
			<UserCard key={user.id} user={user} currentAdminId={currentAdminId} />
		))}
		emptyState={
			<DashboardEmptyState
				icon={Users}
				title="Nenhum usuário encontrado"
				description="Crie o primeiro usuário para começar a gerenciar contas."
			/>
		}
	>
		<TableHeader>
			<TableRow>
				<TableHead>Usuário</TableHead>
				<TableHead>Tipo de conta</TableHead>
				<TableHead>Status</TableHead>
				<TableHead>Criado em</TableHead>
				<TableHead>
					<span className="sr-only">Ações</span>
				</TableHead>
			</TableRow>
		</TableHeader>
		<TableBody>
			{users.map((user) => {
				const status = effectiveStatus(user);
				return (
					<TableRow key={user.id}>
						<TableCell>
							<div className="min-w-0">
								<p className="truncate text-sm font-black text-white">
									{user.username}
								</p>
								<p className="mt-1 truncate text-xs text-white/45">
									{user.email}
								</p>
							</div>
						</TableCell>
						<TableCell>
							<Badge>{roleLabels[user.role] ?? user.role}</Badge>
						</TableCell>
						<TableCell>
							<Badge variant={status.variant}>{status.label}</Badge>
						</TableCell>
						<TableCell className="text-xs text-white/45">
							{formatDateTime(user.createdAt)}
						</TableCell>
						<TableCell>
							<UserActions user={user} currentAdminId={currentAdminId} />
						</TableCell>
					</TableRow>
				);
			})}
		</TableBody>
	</DashboardTableSection>
);

export const AdminCreateUserDialog = () => {
	const [open, setOpen] = useState(false);
	return (
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
				className={getButtonClassName({
					variant: 'secondary',
					size: 'md',
					className: 'gap-2',
				})}
			>
				<UserPlus className="h-4 w-4" />
				Criar usuário
			</button>
			{open ? (
				<Modal
					label="Criar usuário"
					className="max-w-2xl"
					onClose={() => setOpen(false)}
				>
					<div className="mb-4 flex items-center justify-between">
						<h2 className="text-sm font-black text-white">Novo usuário</h2>
						<button
							type="button"
							aria-label="Fechar"
							onClick={() => setOpen(false)}
							className={getButtonClassName({
								variant: 'ghost',
								size: 'icon',
							})}
						>
							<X className="h-4 w-4" />
						</button>
					</div>
					<AdminCreateUserForm onSuccess={() => setOpen(false)} />
				</Modal>
			) : null}
		</>
	);
};
