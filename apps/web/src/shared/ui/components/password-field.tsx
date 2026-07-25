import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { Input } from './input';
import { Label } from './label';

type PasswordFieldProps = {
	description: string;
	error?: string;
	id: string;
	label: string;
	name: string;
	onBlur?: () => void;
	onChange?: (value: string) => void;
	value?: string;
};

export const PasswordField = ({
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
					onChange={
						onChange ? (event) => onChange(event.target.value) : undefined
					}
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
