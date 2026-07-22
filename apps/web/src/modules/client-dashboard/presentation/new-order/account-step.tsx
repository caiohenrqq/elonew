import { ChevronRight, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/shared/ui/components/button';
import { Input } from '@/shared/ui/components/input';
import { Label } from '@/shared/ui/components/label';

export type AccountInput = {
	login: string;
	summonerName: string;
	password: string;
	passwordConfirmation: string;
};

type AccountStepProps = {
	accountInput: AccountInput;
	onBack: () => void;
	onChange: (key: keyof AccountInput, value: string) => void;
	onNext: () => void;
	onNextIntent?: () => void;
};

type PasswordFieldProps = {
	description: string;
	error?: string;
	id: string;
	label: string;
	name: string;
	onBlur: () => void;
	onChange: (value: string) => void;
	value: string;
};

const PasswordField = ({
	description,
	error,
	id,
	label,
	name,
	onBlur,
	onChange,
	value,
}: PasswordFieldProps) => {
	const [isVisible, setIsVisible] = useState(false);
	const helpId = `${id}-help`;

	return (
		<div className="space-y-3">
			<Label htmlFor={id}>
				{label} <span aria-hidden="true">*</span>
			</Label>
			<div className="relative">
				<Input
					id={id}
					name={name}
					type={isVisible ? 'text' : 'password'}
					value={value}
					onChange={(event) => onChange(event.target.value)}
					onBlur={onBlur}
					autoComplete="new-password"
					minLength={8}
					maxLength={128}
					aria-invalid={Boolean(error)}
					aria-describedby={helpId}
					className="h-12 pr-12 text-base md:text-sm"
					required
				/>
				<button
					type="button"
					className="absolute right-0 top-0 flex h-12 w-12 cursor-pointer items-center justify-center text-white/60 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-hextech-cyan"
					onClick={() => setIsVisible((current) => !current)}
					aria-label={isVisible ? `Ocultar ${label}` : `Mostrar ${label}`}
				>
					{isVisible ? (
						<EyeOff className="h-5 w-5" aria-hidden="true" />
					) : (
						<Eye className="h-5 w-5" aria-hidden="true" />
					)}
				</button>
			</div>
			<p
				id={helpId}
				className={error ? 'text-sm text-danger' : 'text-sm text-white/55'}
				role={error ? 'alert' : undefined}
			>
				{error ?? description}
			</p>
		</div>
	);
};

export const AccountStep = ({
	accountInput,
	onBack,
	onChange,
	onNext,
	onNextIntent,
}: AccountStepProps) => {
	const [touchedFields, setTouchedFields] = useState<
		Partial<Record<keyof AccountInput, boolean>>
	>({});
	const hasValidLoginLength =
		accountInput.login.length >= 8 && accountInput.login.length <= 64;
	const hasValidPasswordLength =
		accountInput.password.length >= 8 && accountInput.password.length <= 128;
	const passwordsMatch =
		accountInput.password === accountInput.passwordConfirmation;
	const canContinue =
		hasValidLoginLength &&
		hasValidPasswordLength &&
		accountInput.summonerName.trim().length > 0 &&
		passwordsMatch;
	const markAsTouched = (field: keyof AccountInput) => {
		setTouchedFields((current) => ({ ...current, [field]: true }));
	};

	return (
		<div className="space-y-8">
			<div className="space-y-2">
				<h2 className="text-xl font-black uppercase tracking-[0.2em]">Conta</h2>
				<p className="text-sm leading-relaxed text-white/65">
					Informe os dados da conta que receberá o boost.
				</p>
			</div>

			<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
				<div className="space-y-3">
					<Label htmlFor="account-login">
						Login <span aria-hidden="true">*</span>
					</Label>
					<Input
						id="account-login"
						name="accountLogin"
						value={accountInput.login}
						onChange={(event) => onChange('login', event.target.value)}
						onBlur={() => markAsTouched('login')}
						autoComplete="off"
						minLength={8}
						maxLength={64}
						aria-invalid={touchedFields.login && !hasValidLoginLength}
						aria-describedby="account-login-help"
						className="h-12 text-base md:text-sm"
						required
					/>
					<p
						id="account-login-help"
						className={
							touchedFields.login && !hasValidLoginLength
								? 'text-sm text-danger'
								: 'text-sm text-white/55'
						}
						role={
							touchedFields.login && !hasValidLoginLength ? 'alert' : undefined
						}
					>
						Use entre 8 e 64 caracteres.
					</p>
				</div>
				<div className="space-y-3">
					<Label htmlFor="summoner-name">
						Nome de invocador <span aria-hidden="true">*</span>
					</Label>
					<Input
						id="summoner-name"
						name="summonerName"
						value={accountInput.summonerName}
						onChange={(event) => onChange('summonerName', event.target.value)}
						autoComplete="off"
						className="h-12 text-base md:text-sm"
						required
					/>
				</div>
				<PasswordField
					id="account-password"
					name="accountPassword"
					label="Senha"
					value={accountInput.password}
					onChange={(value) => onChange('password', value)}
					onBlur={() => markAsTouched('password')}
					description="Use entre 8 e 128 caracteres."
					error={
						touchedFields.password && !hasValidPasswordLength
							? 'A senha deve ter entre 8 e 128 caracteres.'
							: undefined
					}
				/>
				<PasswordField
					id="account-password-confirmation"
					name="accountPasswordConfirmation"
					label="Confirmar senha"
					value={accountInput.passwordConfirmation}
					onChange={(value) => onChange('passwordConfirmation', value)}
					onBlur={() => markAsTouched('passwordConfirmation')}
					description="Repita a senha."
					error={
						touchedFields.passwordConfirmation && !passwordsMatch
							? 'As senhas não coincidem.'
							: undefined
					}
				/>
			</div>

			<aside className="border border-hextech-gold/30 bg-hextech-gold/5 p-4">
				<div className="flex items-center gap-2 text-hextech-gold">
					<ShieldCheck className="h-5 w-5" aria-hidden="true" />
					<h3 className="text-sm font-black uppercase tracking-widest">
						Cuidados com sua senha
					</h3>
				</div>
				<ol className="mt-4 space-y-3 text-sm leading-relaxed text-white/75">
					<li className="border-b border-white/10 pb-3">
						<span className="mr-2 font-black text-hextech-gold">1.</span>
						Antes de iniciar o boost, recomendamos que você use uma senha nova.
					</li>
					<li>
						<span className="mr-2 font-black text-hextech-gold">2.</span>
						Quando o boost terminar, crie outra senha nova e exclusiva.
					</li>
				</ol>
			</aside>

			<div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:justify-end">
				<Button
					variant="outline"
					size="lg"
					className="w-full sm:w-auto"
					onClick={onBack}
				>
					Voltar
				</Button>
				<Button
					size="lg"
					onClick={onNext}
					onFocus={onNextIntent}
					onMouseEnter={onNextIntent}
					className="w-full sm:w-auto"
					disabled={!canContinue}
				>
					Revisar Pedido
					<ChevronRight className="ml-2 h-4 w-4" aria-hidden="true" />
				</Button>
			</div>
		</div>
	);
};
