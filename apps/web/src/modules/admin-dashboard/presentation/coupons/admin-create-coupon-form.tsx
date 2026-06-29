'use client';

import { COUPON_MAX_PERCENTAGE_DISCOUNT } from '@packages/shared/coupons/coupon';
import { orderExtraTypes } from '@packages/shared/orders/order-extra';
import {
	orderRankProgression,
	rankPricedOrderServiceTypes,
} from '@packages/shared/orders/order-rank-progression';
import { orderServiceTypes } from '@packages/shared/orders/service-type';
import { CheckCircle2, TicketPercent, X } from 'lucide-react';
import Image from 'next/image';
import {
	type ReactNode,
	useActionState,
	useEffect,
	useId,
	useRef,
	useState,
} from 'react';
import {
	getExtraLabel,
	getLeagueLabel,
	QUEUES,
} from '@/modules/client-dashboard/model/new-order-options';
import { getRankOption } from '@/modules/client-dashboard/model/rank-options';
import { Badge } from '@/shared/ui/components/badge';
import { getButtonClassName } from '@/shared/ui/components/button';
import { Label } from '@/shared/ui/components/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/shared/ui/components/select';
import { SelectableOption } from '@/shared/ui/components/selectable-option';
import { fieldSurface, labelText } from '@/shared/ui/styles/classes';
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

const fieldLabel = labelText.control;

const NO_RANK = 'none';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const rankSelectOptions = orderRankProgression.map((step) => {
	const divisionLabel = step.division === 'MASTER' ? '' : ` ${step.division}`;
	return {
		value: `${step.league}:${step.division}`,
		label: `${getLeagueLabel(step.league)}${divisionLabel}`,
		image: getRankOption(step.league).image,
	};
});

const rankParts = (value: string): [string, string] =>
	value && value !== NO_RANK
		? (value.split(':') as [string, string])
		: ['', ''];

const OptionCard = ({
	selected,
	onClick,
	children,
}: {
	selected: boolean;
	onClick: () => void;
	children: ReactNode;
}) => (
	<SelectableOption
		layout="row"
		selected={selected}
		onClick={onClick}
		className="min-h-11 justify-start gap-3 px-3 py-2 text-left"
	>
		<span
			className={cn(
				'flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border transition-colors',
				selected ? 'border-hextech-cyan bg-hextech-cyan' : 'border-white/20',
			)}
		>
			{selected ? <CheckCircle2 className="h-3 w-3 text-black" /> : null}
		</span>
		<span className="text-left text-[10px] font-black uppercase tracking-widest">
			{children}
		</span>
	</SelectableOption>
);

const AmountField = ({
	name,
	label,
	mode,
	digits,
	onDigitsChange,
	zeroPlaceholder,
}: {
	name: string;
	label: string;
	mode: 'currency' | 'percentage';
	digits: string;
	onDigitsChange: (digits: string) => void;
	zeroPlaceholder?: string;
}) => {
	const isCurrency = mode === 'currency';
	const numeric = Number.parseInt(digits || '0', 10);
	const value = isCurrency
		? numeric
		: Math.min(numeric, COUPON_MAX_PERCENTAGE_DISCOUNT);
	const showPlaceholder = Boolean(zeroPlaceholder) && value === 0;
	const display = showPlaceholder
		? ''
		: isCurrency
			? (value / 100).toFixed(2).replace('.', ',')
			: String(value);
	const canonical = isCurrency ? (value / 100).toFixed(2) : String(value);

	const handleChange = (raw: string) => {
		const onlyDigits = raw.replace(/\D/g, '');
		if (onlyDigits === '') return onDigitsChange('0');
		if (isCurrency)
			return onDigitsChange(onlyDigits.slice(0, 9).replace(/^0+(?=\d)/, ''));
		onDigitsChange(
			String(
				Math.min(
					Number.parseInt(onlyDigits, 10),
					COUPON_MAX_PERCENTAGE_DISCOUNT,
				),
			),
		);
	};

	return (
		<div className="grid gap-2">
			<span className={fieldLabel}>{label}</span>
			<div className="relative">
				{isCurrency ? (
					<span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/40">
						R$
					</span>
				) : null}
				<input
					inputMode="numeric"
					value={display}
					onChange={(event) => handleChange(event.target.value)}
					placeholder={zeroPlaceholder}
					className={cn(
						fieldSurface,
						'bg-black/20',
						isCurrency ? 'pl-9' : 'pr-8',
					)}
				/>
				{isCurrency ? null : (
					<span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/40">
						%
					</span>
				)}
			</div>
			<input type="hidden" name={name} value={canonical} />
		</div>
	);
};

const EmailChips = ({
	emails,
	setEmails,
}: {
	emails: string[];
	setEmails: React.Dispatch<React.SetStateAction<string[]>>;
}) => {
	const [draft, setDraft] = useState('');

	const addEmail = (raw: string) => {
		const email = raw.trim().toLowerCase();
		if (!EMAIL_PATTERN.test(email)) return false;
		setEmails((prev) => (prev.includes(email) ? prev : [...prev, email]));
		return true;
	};

	const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (event.key === 'Enter' || event.key === ',') {
			event.preventDefault();
			if (addEmail(draft)) setDraft('');
			return;
		}
		if (event.key === 'Backspace' && draft === '' && emails.length > 0) {
			setEmails((prev) => prev.slice(0, -1));
		}
	};

	const handleChange = (value: string) => {
		if (!value.includes(',')) {
			setDraft(value);
			return;
		}
		const parts = value.split(',');
		const last = parts.pop() ?? '';
		for (const part of parts) addEmail(part);
		setDraft(last);
	};

	return (
		<div
			className={cn(
				fieldSurface,
				'h-auto min-h-11 flex-wrap items-center gap-2 bg-black/20',
			)}
		>
			{emails.map((email) => (
				<Badge
					key={email}
					variant="info"
					className="gap-1 normal-case tracking-normal"
				>
					{email}
					<button
						type="button"
						aria-label={`Remover ${email}`}
						onClick={() => setEmails((prev) => prev.filter((e) => e !== email))}
						className="text-white/60 transition-colors hover:text-white"
					>
						<X className="h-3 w-3" />
					</button>
				</Badge>
			))}
			<input
				value={draft}
				onChange={(event) => handleChange(event.target.value)}
				onKeyDown={handleKeyDown}
				onBlur={() => {
					if (addEmail(draft)) setDraft('');
				}}
				placeholder={emails.length > 0 ? '' : 'cliente@email.com'}
				className="min-w-32 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-white/20"
			/>
			{emails.map((email) => (
				<input key={email} type="hidden" name="allowedEmails" value={email} />
			))}
		</div>
	);
};

const CouponRankSelect = ({
	label,
	value,
	onChange,
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
}) => {
	const id = useId();
	return (
		<div className="grid gap-2">
			<Label htmlFor={id}>{label}</Label>
			<Select value={value} onValueChange={onChange}>
				<SelectTrigger id={id} className="bg-black/20">
					<SelectValue placeholder="Sem limite" />
				</SelectTrigger>
				<SelectContent className="z-[110]" side="bottom">
					<SelectItem value={NO_RANK}>Sem limite</SelectItem>
					{rankSelectOptions.map((option) => (
						<SelectItem key={option.value} value={option.value}>
							<span className="flex items-center gap-2">
								<Image
									src={option.image}
									alt=""
									width={16}
									height={16}
									className="h-4 w-4 object-contain"
								/>
								{option.label}
							</span>
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
};

export const AdminCreateCouponForm = ({
	onSuccess,
}: {
	onSuccess?: () => void;
}) => {
	const [state, formAction, pending] = useActionState<
		CouponActionState,
		FormData
	>(createAdminCouponAction, {});
	const formRef = useRef<HTMLFormElement>(null);

	const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>(
		'percentage',
	);
	const [discountDigits, setDiscountDigits] = useState('0');
	const [minSubtotalDigits, setMinSubtotalDigits] = useState('0');
	const [maxSubtotalDigits, setMaxSubtotalDigits] = useState('0');
	const [allowedServiceTypes, setAllowedServiceTypes] = useState<string[]>([]);
	const [allowedQueues, setAllowedQueues] = useState<string[]>([]);
	const [requiredExtra, setRequiredExtra] = useState('');
	const [firstOrderOnly, setFirstOrderOnly] = useState(false);
	const [minRank, setMinRank] = useState(NO_RANK);
	const [maxRank, setMaxRank] = useState(NO_RANK);
	const [emails, setEmails] = useState<string[]>([]);

	useEffect(() => {
		if (!state.success) return;
		formRef.current?.reset();
		setDiscountType('percentage');
		setDiscountDigits('0');
		setMinSubtotalDigits('0');
		setMaxSubtotalDigits('0');
		setAllowedServiceTypes([]);
		setAllowedQueues([]);
		setRequiredExtra('');
		setFirstOrderOnly(false);
		setMinRank(NO_RANK);
		setMaxRank(NO_RANK);
		setEmails([]);
		onSuccess?.();
	}, [state.success, onSuccess]);

	const isPercentage = discountType === 'percentage';
	const [minLeague, minDivision] = rankParts(minRank);
	const [maxLeague, maxDivision] = rankParts(maxRank);

	const showsExtras =
		allowedServiceTypes.length === 0 ||
		allowedServiceTypes.some((service) =>
			(rankPricedOrderServiceTypes as readonly string[]).includes(service),
		);

	useEffect(() => {
		if (!showsExtras) setRequiredExtra('');
	}, [showsExtras]);

	const selectDiscountType = (type: 'percentage' | 'fixed') => {
		setDiscountType(type);
		setDiscountDigits('0');
	};

	const toggleValue = (
		setter: React.Dispatch<React.SetStateAction<string[]>>,
		value: string,
	) =>
		setter((prev) =>
			prev.includes(value)
				? prev.filter((entry) => entry !== value)
				: [...prev, value],
		);

	return (
		<form ref={formRef} action={formAction} className="grid gap-5">
			<fieldset className="grid gap-2">
				<span className={fieldLabel}>Tipo de desconto</span>
				<div className="grid gap-2 sm:grid-cols-2">
					<OptionCard
						selected={isPercentage}
						onClick={() => selectDiscountType('percentage')}
					>
						Percentual (%)
					</OptionCard>
					<OptionCard
						selected={!isPercentage}
						onClick={() => selectDiscountType('fixed')}
					>
						Valor fixo (R$)
					</OptionCard>
				</div>
			</fieldset>

			<div className="grid gap-3 md:grid-cols-2">
				<label className="grid gap-2">
					<span className={fieldLabel}>Código (opcional)</span>
					<input
						name="code"
						className={cn(fieldSurface, 'bg-black/20')}
						placeholder="Deixe em branco para gerar automaticamente"
						maxLength={24}
					/>
				</label>
				<AmountField
					name="discount"
					label="Desconto"
					mode={isPercentage ? 'percentage' : 'currency'}
					digits={discountDigits}
					onDigitsChange={setDiscountDigits}
				/>
			</div>

			<fieldset className="grid gap-2">
				<span className={fieldLabel}>Serviços permitidos (vazio = todos)</span>
				<div className="grid gap-2 sm:grid-cols-2">
					{orderServiceTypes.map((serviceType) => (
						<OptionCard
							key={serviceType}
							selected={allowedServiceTypes.includes(serviceType)}
							onClick={() => toggleValue(setAllowedServiceTypes, serviceType)}
						>
							{serviceTypeLabels[serviceType] ?? serviceType}
						</OptionCard>
					))}
				</div>
			</fieldset>

			<fieldset className="grid gap-2">
				<span className={fieldLabel}>Filas permitidas (vazio = todas)</span>
				<div className="grid gap-2 sm:grid-cols-2">
					{QUEUES.map((queue) => (
						<OptionCard
							key={queue.value}
							selected={allowedQueues.includes(queue.value)}
							onClick={() => toggleValue(setAllowedQueues, queue.value)}
						>
							{queue.label}
						</OptionCard>
					))}
				</div>
			</fieldset>

			<div className="grid gap-3 md:grid-cols-2">
				<AmountField
					name="minSubtotal"
					label="Subtotal mínimo"
					mode="currency"
					digits={minSubtotalDigits}
					onDigitsChange={setMinSubtotalDigits}
					zeroPlaceholder="Sem limite"
				/>
				<AmountField
					name="maxSubtotal"
					label="Subtotal máximo"
					mode="currency"
					digits={maxSubtotalDigits}
					onDigitsChange={setMaxSubtotalDigits}
					zeroPlaceholder="Sem limite"
				/>
			</div>

			<div className="grid gap-3 md:grid-cols-2">
				<CouponRankSelect
					label="Rank mínimo"
					value={minRank}
					onChange={setMinRank}
				/>
				<CouponRankSelect
					label="Rank máximo"
					value={maxRank}
					onChange={setMaxRank}
				/>
			</div>

			{showsExtras ? (
				<fieldset className="grid gap-2">
					<span className={fieldLabel}>Extra obrigatório (opcional)</span>
					<div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
						{orderExtraTypes.map((extra) => (
							<OptionCard
								key={extra}
								selected={requiredExtra === extra}
								onClick={() =>
									setRequiredExtra((prev) => (prev === extra ? '' : extra))
								}
							>
								{getExtraLabel(extra)}
							</OptionCard>
						))}
					</div>
				</fieldset>
			) : null}

			<div className="grid gap-3 md:grid-cols-3">
				<label className="grid gap-2">
					<span className={fieldLabel}>Mínimo de extras</span>
					<input
						name="minExtrasCount"
						type="number"
						min="1"
						className={cn(fieldSurface, 'bg-black/20')}
					/>
				</label>
				<label className="grid gap-2">
					<span className={fieldLabel}>
						Limite global de uso (vazio = ilimitado)
					</span>
					<input
						name="globalUsageLimit"
						type="number"
						min="1"
						className={cn(fieldSurface, 'bg-black/20')}
						placeholder="Ilimitado"
					/>
				</label>
				<label className="grid gap-2">
					<span className={fieldLabel}>
						Limite por usuário (vazio = ilimitado)
					</span>
					<input
						name="perUserUsageLimit"
						type="number"
						min="1"
						className={cn(fieldSurface, 'bg-black/20')}
						placeholder="Ilimitado"
					/>
				</label>
			</div>

			<div className="grid gap-2">
				<span className={fieldLabel}>E-mails permitidos (vírgula/enter)</span>
				<EmailChips emails={emails} setEmails={setEmails} />
			</div>

			<fieldset className="grid gap-2">
				<span className={fieldLabel}>Restrições</span>
				<OptionCard
					selected={firstOrderOnly}
					onClick={() => setFirstOrderOnly((value) => !value)}
				>
					Apenas primeira compra
				</OptionCard>
			</fieldset>

			<input type="hidden" name="discountType" value={discountType} />
			{allowedServiceTypes.map((value) => (
				<input
					key={value}
					type="hidden"
					name="allowedServiceTypes"
					value={value}
				/>
			))}
			{allowedQueues.map((value) => (
				<input key={value} type="hidden" name="allowedQueues" value={value} />
			))}
			{requiredExtra ? (
				<input type="hidden" name="requiredExtra" value={requiredExtra} />
			) : null}
			{firstOrderOnly ? (
				<input type="hidden" name="firstOrderOnly" value="on" />
			) : null}
			<input type="hidden" name="minRankLeague" value={minLeague} />
			<input type="hidden" name="minRankDivision" value={minDivision} />
			<input type="hidden" name="maxRankLeague" value={maxLeague} />
			<input type="hidden" name="maxRankDivision" value={maxDivision} />

			<div className="flex items-center justify-between gap-4 border-t border-white/5 pt-4">
				<p
					className={cn(
						'min-h-4 text-[10px] font-medium',
						state.error ? 'text-red-300' : 'text-emerald-300',
					)}
				>
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
