'use client';

import { UserPlus } from 'lucide-react';
import { useActionState, useEffect, useRef } from 'react';
import { getButtonClassName } from '@/shared/ui/components/button';
import { fieldSurface } from '@/shared/ui/styles/classes';
import { cn } from '@/shared/ui/utils/cn';
import {
	type AdminCreateUserActionState,
	createAdminUserAction,
} from '../../actions/admin-actions';

const roleOptions = [
	{ value: 'CLIENT', label: 'Cliente' },
	{ value: 'BOOSTER', label: 'Booster' },
	{ value: 'ADMIN', label: 'Admin' },
] as const;

export const AdminCreateUserForm = () => {
	const [state, formAction, pending] = useActionState<
		AdminCreateUserActionState,
		FormData
	>(createAdminUserAction, {});
	const formRef = useRef<HTMLFormElement>(null);

	useEffect(() => {
		if (state.success) formRef.current?.reset();
	}, [state.success]);

	return (
		<form
			ref={formRef}
			action={formAction}
			className="grid gap-3 rounded-sm border border-white/10 bg-white/[0.02] p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_160px_auto]"
		>
			<label className="grid gap-2">
				<span className="text-[10px] font-black uppercase tracking-widest text-white/35">
					Usuário
				</span>
				<input
					name="username"
					className={cn(fieldSurface, 'bg-black/20')}
					placeholder="nome de usuário"
					required
				/>
			</label>
			<label className="grid gap-2">
				<span className="text-[10px] font-black uppercase tracking-widest text-white/35">
					E-mail
				</span>
				<input
					name="email"
					type="email"
					className={cn(fieldSurface, 'bg-black/20')}
					placeholder="usuario@email.com"
					required
				/>
			</label>
			<label className="grid gap-2">
				<span className="text-[10px] font-black uppercase tracking-widest text-white/35">
					Perfil
				</span>
				<select
					name="role"
					className={cn(fieldSurface, 'bg-black/20')}
					defaultValue="CLIENT"
				>
					{roleOptions.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>
			</label>
			<div className="grid content-end gap-2">
				<button
					type="submit"
					disabled={pending}
					className={getButtonClassName({
						size: 'md',
						variant: 'secondary',
						className: 'min-h-11 gap-2',
					})}
				>
					<UserPlus className="h-4 w-4" />
					{pending ? 'Criando' : 'Criar'}
				</button>
			</div>
			<p className="min-h-4 text-[10px] font-medium text-red-300 md:col-span-4">
				{state.error ?? (state.success ? 'Usuário criado.' : '')}
			</p>
		</form>
	);
};
