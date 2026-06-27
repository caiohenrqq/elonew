'use client';

import { orderExtraTypes } from '@packages/shared/orders/order-extra';
import { orderRankProgression } from '@packages/shared/orders/order-rank-progression';
import { orderServiceTypes } from '@packages/shared/orders/service-type';
import { TicketPercent } from 'lucide-react';
import { useActionState, useEffect, useRef } from 'react';
import { getButtonClassName } from '@/shared/ui/components/button';
import { fieldSurface } from '@/shared/ui/styles/classes';
import { cn } from '@/shared/ui/utils/cn';
import {
	type CouponActionState,
	createAdminCouponAction,
} from '../../actions/coupon-actions';

const serviceTypeLabels: Record<string, string> = {
	elo_boost: 'Elojob',
	duo_boost: 'Duo Boost',
	md5: 'MD5',
	coaching: 'Coaching',
};

const fieldLabel =
	'text-[10px] font-black uppercase tracking-widest text-white/35';

const rankOptions = orderRankProgression.map((step) => ({
	value: `${step.league}:${step.division}`,
	label: `${step.league} ${step.division}`,
	league: step.league,
	division: step.division,
}));

export const AdminCreateCouponForm = () => {
	const [state, formAction, pending] = useActionState<
		CouponActionState,
		FormData
	>(createAdminCouponAction, {});
	const formRef = useRef<HTMLFormElement>(null);

	useEffect(() => {
		if (state.success) formRef.current?.reset();
	}, [state.success]);

	return (
		<form
			ref={formRef}
			action={formAction}
			className="grid gap-4 rounded-sm border border-white/10 bg-white/[0.02] p-4"
		>
			<div className="grid gap-3 md:grid-cols-[200px_160px_minmax(0,1fr)]">
				<label className="grid gap-2">
					<span className={fieldLabel}>Código (opcional)</span>
					<input
						name="code"
						className={cn(fieldSurface, 'bg-black/20')}
						placeholder="gerado se vazio"
						maxLength={24}
					/>
				</label>
				<label className="grid gap-2">
					<span className={fieldLabel}>Tipo</span>
					<select
						name="discountType"
						className={cn(fieldSurface, 'bg-black/20')}
						defaultValue="percentage"
					>
						<option value="percentage">Percentual (%)</option>
						<option value="fixed">Valor fixo (R$)</option>
					</select>
				</label>
				<label className="grid gap-2">
					<span className={fieldLabel}>Desconto</span>
					<input
						name="discount"
						type="number"
						step="0.01"
						min="0"
						className={cn(fieldSurface, 'bg-black/20')}
						required
					/>
				</label>
			</div>

			<fieldset className="grid gap-2">
				<span className={fieldLabel}>Serviços permitidos (vazio = todos)</span>
				<div className="flex flex-wrap gap-3">
					{orderServiceTypes.map((serviceType) => (
						<label
							key={serviceType}
							className="flex items-center gap-2 text-xs text-white/70"
						>
							<input
								type="checkbox"
								name="allowedServiceTypes"
								value={serviceType}
							/>
							{serviceTypeLabels[serviceType] ?? serviceType}
						</label>
					))}
				</div>
			</fieldset>

			<div className="grid gap-3 md:grid-cols-2">
				<label className="grid gap-2">
					<span className={fieldLabel}>Subtotal mínimo (R$)</span>
					<input
						name="minSubtotal"
						type="number"
						step="0.01"
						min="0"
						className={cn(fieldSurface, 'bg-black/20')}
					/>
				</label>
				<label className="grid gap-2">
					<span className={fieldLabel}>Subtotal máximo (R$)</span>
					<input
						name="maxSubtotal"
						type="number"
						step="0.01"
						min="0"
						className={cn(fieldSurface, 'bg-black/20')}
					/>
				</label>
			</div>

			<div className="grid gap-3 md:grid-cols-2">
				<div className="grid gap-2">
					<span className={fieldLabel}>Rank mínimo</span>
					<RankSelect prefix="minRank" />
				</div>
				<div className="grid gap-2">
					<span className={fieldLabel}>Rank máximo</span>
					<RankSelect prefix="maxRank" />
				</div>
			</div>

			<div className="grid gap-3 md:grid-cols-2">
				<label className="grid gap-2">
					<span className={fieldLabel}>
						Filas permitidas (separadas por vírgula)
					</span>
					<input
						name="allowedQueues"
						className={cn(fieldSurface, 'bg-black/20')}
						placeholder="solo_duo, flex"
					/>
				</label>
				<label className="grid gap-2">
					<span className={fieldLabel}>E-mails permitidos (vírgula/linha)</span>
					<textarea
						name="allowedEmails"
						className={cn(fieldSurface, 'min-h-11 bg-black/20')}
						placeholder="cliente@email.com"
					/>
				</label>
			</div>

			<div className="grid gap-3 md:grid-cols-2">
				<label className="grid gap-2">
					<span className={fieldLabel}>Extra obrigatório</span>
					<select
						name="requiredExtra"
						className={cn(fieldSurface, 'bg-black/20')}
						defaultValue=""
					>
						<option value="">Nenhum</option>
						{orderExtraTypes.map((extra) => (
							<option key={extra} value={extra}>
								{extra}
							</option>
						))}
					</select>
				</label>
				<label className="grid gap-2">
					<span className={fieldLabel}>Mínimo de extras</span>
					<input
						name="minExtrasCount"
						type="number"
						min="1"
						className={cn(fieldSurface, 'bg-black/20')}
					/>
				</label>
			</div>

			<div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
				<label className="grid gap-2">
					<span className={fieldLabel}>Limite global de uso</span>
					<input
						name="globalUsageLimit"
						type="number"
						min="1"
						className={cn(fieldSurface, 'bg-black/20')}
						placeholder="ilimitado"
					/>
				</label>
				<label className="grid gap-2">
					<span className={fieldLabel}>Limite por usuário</span>
					<input
						name="perUserUsageLimit"
						type="number"
						min="1"
						className={cn(fieldSurface, 'bg-black/20')}
						placeholder="ilimitado"
					/>
				</label>
				<label className="flex items-end gap-2 text-xs text-white/70">
					<input type="checkbox" name="firstOrderOnly" />
					Apenas primeira compra
				</label>
			</div>

			<div className="flex items-center justify-between gap-4">
				<p className="min-h-4 text-[10px] font-medium text-red-300">
					{state.error ?? (state.success ? 'Cupom criado.' : '')}
				</p>
				<button
					type="submit"
					disabled={pending}
					className={getButtonClassName({
						size: 'md',
						variant: 'secondary',
						className: 'min-h-11 gap-2',
					})}
				>
					<TicketPercent className="h-4 w-4" />
					{pending ? 'Criando' : 'Criar cupom'}
				</button>
			</div>
		</form>
	);
};

const RankSelect = ({ prefix }: { prefix: 'minRank' | 'maxRank' }) => (
	<>
		<select
			className={cn(fieldSurface, 'bg-black/20')}
			defaultValue=""
			onChange={(event) => {
				const [league, division] = event.target.value.split(':');
				const form = event.target.form;
				if (!form) return;
				(form.elements.namedItem(`${prefix}League`) as HTMLInputElement).value =
					league ?? '';
				(
					form.elements.namedItem(`${prefix}Division`) as HTMLInputElement
				).value = division ?? '';
			}}
		>
			<option value="">Sem limite</option>
			{rankOptions.map((option) => (
				<option key={option.value} value={option.value}>
					{option.label}
				</option>
			))}
		</select>
		<input type="hidden" name={`${prefix}League`} />
		<input type="hidden" name={`${prefix}Division`} />
	</>
);
