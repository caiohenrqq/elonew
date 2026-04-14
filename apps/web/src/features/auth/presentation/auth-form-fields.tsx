import { getButtonClassName } from '@packages/ui/components/button';
import { Checkbox, type CheckboxProps } from '@packages/ui/components/checkbox';
import { Input, type InputProps } from '@packages/ui/components/input';
import { Label } from '@packages/ui/components/label';
import { cn } from '@packages/ui/utils/cn';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';
import type { ElementType, ReactNode } from 'react';

type AuthFieldProps = InputProps & {
	error?: string;
	icon: ElementType;
	label: string;
	labelAction?: ReactNode;
};

export const AuthField = ({
	className,
	error,
	icon: Icon,
	id,
	label,
	labelAction,
	type,
	...props
}: AuthFieldProps) => (
	<div className="space-y-2">
		<div className="flex items-center justify-between">
			<Label htmlFor={id}>{label}</Label>
			{labelAction}
		</div>
		<div className="relative group">
			<Icon className="absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 text-white/20 transition-colors group-focus-within:text-hextech-cyan" />
			<Input
				id={id}
				type={type}
				className={cn(
					'pl-9',
					type === 'password' && 'font-sans text-sm tracking-[0.1em]',
					className,
				)}
				aria-invalid={Boolean(error)}
				{...props}
			/>
		</div>
		{error ? <AuthErrorText>{error}</AuthErrorText> : null}
	</div>
);

export const AuthErrorText = ({ children }: { children: ReactNode }) => (
	<motion.div
		initial={{ opacity: 0, height: 0 }}
		animate={{ opacity: 1, height: 'auto' }}
		className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-sm"
	>
		<AlertCircle className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />
		<p className="text-[10px] text-red-400 uppercase tracking-widest leading-relaxed">
			{children}
		</p>
	</motion.div>
);

export const AuthSuccessText = ({ children }: { children: ReactNode }) => (
	<motion.div
		initial={{ opacity: 0, height: 0 }}
		animate={{ opacity: 1, height: 'auto' }}
		className="flex items-start gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-sm"
	>
		<CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
		<p className="text-[10px] text-emerald-400 uppercase tracking-widest leading-relaxed">
			{children}
		</p>
	</motion.div>
);

export const AuthCheckboxField = ({
	children,
	error,
	id,
	...props
}: CheckboxProps & {
	children: ReactNode;
	error?: string;
	id: string;
}) => (
	<div className="space-y-2">
		<div className="flex items-center gap-3">
			<Checkbox id={id} aria-invalid={Boolean(error)} {...props} />
			<label
				htmlFor={id}
				className="text-[9px] text-white/40 uppercase tracking-widest cursor-pointer select-none hover:text-white/60 transition-colors"
			>
				{children}
			</label>
		</div>
		{error ? <AuthErrorText>{error}</AuthErrorText> : null}
	</div>
);

export const AuthSwitchLink = ({
	href,
	children,
}: {
	children: ReactNode;
	href: string;
}) => (
	<motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
		<Link
			href={href}
			className={getButtonClassName({
				variant: 'outline',
				size: 'md',
				className:
					'w-full text-[10px] tracking-[0.2em] font-black hover:shadow-[0_0_15px_rgba(255,255,255,0.05)] transition-all uppercase',
			})}
		>
			{children}
		</Link>
	</motion.div>
);
