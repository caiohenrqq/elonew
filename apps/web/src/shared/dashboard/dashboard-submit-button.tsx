'use client';

import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useFormStatus } from 'react-dom';
import {
	type ButtonSize,
	type ButtonVariant,
	getButtonClassName,
} from '@/shared/ui/components/button';
import { cn } from '@/shared/ui/utils/cn';

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
