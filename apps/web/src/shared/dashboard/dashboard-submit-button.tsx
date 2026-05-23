'use client';

import {
	type ButtonSize,
	type ButtonVariant,
	getButtonClassName,
} from '@packages/ui/components/button';
import { cn } from '@packages/ui/utils/cn';
import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useFormStatus } from 'react-dom';

type DashboardSubmitButtonProps = {
	children: ReactNode;
	className?: string;
	pendingLabel?: string;
	size?: ButtonSize;
	variant?: ButtonVariant;
};

export const DashboardSubmitButton = ({
	children,
	className,
	pendingLabel = 'Processando',
	size = 'sm',
	variant = 'primary',
}: DashboardSubmitButtonProps) => {
	const { pending } = useFormStatus();

	return (
		<button
			type="submit"
			disabled={pending}
			aria-busy={pending}
			className={getButtonClassName({
				variant,
				size,
				className: cn('gap-2', className),
			})}
		>
			{pending ? (
				<>
					<Loader2 className="h-3 w-3 animate-spin" />
					{pendingLabel}
				</>
			) : (
				children
			)}
		</button>
	);
};
