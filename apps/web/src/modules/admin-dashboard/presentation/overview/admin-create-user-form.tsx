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

import { roleOptions } from '../users/admin-user-metadata';

export const AdminCreateUserForm = ({
	onSuccess,
}: {
	onSuccess?: () => void;
}) => {
	const [state, formAction, pending] = useActionState<
		AdminCreateUserActionState,
		FormData
	>(createAdminUserAction, {});
	const formRef = useRef<HTMLFormElement>(null);

	useEffect(() => {
		if (state.success) {
			formRef.current?.reset();
			onSuccess?.();
		}
	}, [state.success, onSuccess]);

	return (
		<form
			ref={formRef}
			action={formAction}
			className="grid gap-3 md:grid-cols-2"
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
			<div className="grid content-end gap-2 md:col-span-2">
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
					{pending ? 'Criando' : 'Criar usuário'}
				</button>
			</div>
			<p className="min-h-4 text-[10px] font-medium text-red-300 md:col-span-2">
				{state.error ?? (state.success ? 'Usuário criado.' : '')}
			</p>
		</form>
	);
};
