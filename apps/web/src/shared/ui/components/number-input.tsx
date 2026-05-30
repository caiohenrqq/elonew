'use client';

import { Minus, Plus } from 'lucide-react';
import * as React from 'react';
import { fieldSurface } from '../styles/classes';
import { cn } from '../utils/cn';
import { Button } from './button';

export interface NumberInputProps
	extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
	value: number;
	onChange: (value: number) => void;
	min?: number;
	max?: number;
	step?: number;
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
	(
		{ className, value, onChange, min, max, step = 1, disabled, ...props },
		ref,
	) => {
		const clampValue = (nextValue: number) => {
			if (min !== undefined && nextValue < min) return min;
			if (max !== undefined && nextValue > max) return max;
			return nextValue;
		};

		const handleIncrement = () => {
			if (disabled) return;
			onChange(clampValue(value + step));
		};

		const handleDecrement = () => {
			if (disabled) return;
			onChange(clampValue(value - step));
		};

		const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			const newValue = e.target.value === '' ? 0 : Number(e.target.value);
			if (Number.isNaN(newValue)) return;
			onChange(clampValue(newValue));
		};

		const isMinDisabled = disabled || (min !== undefined && value <= min);
		const isMaxDisabled = disabled || (max !== undefined && value >= max);

		return (
			<div className={cn('flex items-center gap-1', className)}>
				<Button
					type="button"
					variant="outline"
					size="icon"
					aria-label="Diminuir valor"
					className="h-10 w-10 shrink-0 bg-white/5 hover:bg-white/10"
					onClick={handleDecrement}
					disabled={isMinDisabled}
				>
					<Minus className="h-3 w-3" />
				</Button>
				<input
					type="number"
					className={cn(
						fieldSurface,
						'flex-1 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
					)}
					ref={ref}
					value={value}
					onChange={handleChange}
					min={min}
					max={max}
					step={step}
					disabled={disabled}
					{...props}
				/>
				<Button
					type="button"
					variant="outline"
					size="icon"
					aria-label="Aumentar valor"
					className="h-10 w-10 shrink-0 bg-white/5 hover:bg-white/10"
					onClick={handleIncrement}
					disabled={isMaxDisabled}
				>
					<Plus className="h-3 w-3" />
				</Button>
			</div>
		);
	},
);
NumberInput.displayName = 'NumberInput';

export { NumberInput };
