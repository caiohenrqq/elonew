'use client';

import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';
import * as React from 'react';
import { cn } from '../utils/cn';

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
	React.ElementRef<typeof SelectPrimitive.Trigger>,
	React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
	<SelectPrimitive.Trigger
		ref={ref}
		className={cn(
			'flex h-10 w-full items-center justify-between rounded-sm border border-white/10 bg-white/5 px-3 py-2 text-xs text-white ring-offset-black placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-hextech-cyan focus:border-hextech-cyan disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 group data-[placeholder]:text-white/40',
			className,
		)}
		{...props}
	>
		{children}
		<SelectPrimitive.Icon asChild>
			<ChevronDown className="h-4 w-4 text-white/40 transition-transform duration-200 group-data-[state=open]:rotate-180" />
		</SelectPrimitive.Icon>
	</SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectContent = React.forwardRef<
	React.ElementRef<typeof SelectPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => {
	return (
		<SelectPrimitive.Portal>
			<SelectPrimitive.Content
				ref={ref}
				className={cn(
					'relative z-50 min-w-[8rem] overflow-hidden rounded-sm border border-white/10 bg-[#0c0c0e] text-white shadow-2xl',
					position === 'popper' &&
						'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
					className,
				)}
				position={position}
				asChild
				{...props}
			>
				<motion.div
					initial={{ opacity: 0, y: -10, scale: 0.98 }}
					animate={{ opacity: 1, y: 0, scale: 1 }}
					transition={{
						type: 'spring',
						stiffness: 300,
						damping: 25,
						mass: 0.8,
					}}
				>
					<SelectPrimitive.Viewport
						className={cn(
							'p-1',
							position === 'popper' &&
								'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]',
						)}
					>
						{children}
					</SelectPrimitive.Viewport>
				</motion.div>
			</SelectPrimitive.Content>
		</SelectPrimitive.Portal>
	);
});
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef<
	React.ElementRef<typeof SelectPrimitive.Label>,
	React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
	<SelectPrimitive.Label
		ref={ref}
		className={cn(
			'py-1.5 pl-8 pr-2 text-xs font-semibold text-white/40',
			className,
		)}
		{...props}
	/>
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectItem = React.forwardRef<
	React.ElementRef<typeof SelectPrimitive.Item>,
	React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
	<SelectPrimitive.Item
		ref={ref}
		className={cn(
			'relative flex w-full cursor-default select-none items-center rounded-sm py-2 pl-8 pr-2 text-xs outline-none focus:bg-white/10 focus:text-white data-[disabled]:pointer-events-none data-[disabled]:opacity-50 transition-colors duration-200 group',
			className,
		)}
		{...props}
	>
		<motion.span
			className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center"
			initial={false}
		>
			<SelectPrimitive.ItemIndicator>
				<motion.div
					initial={{ scale: 0, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					transition={{ type: 'spring', stiffness: 500, damping: 30 }}
				>
					<Check className="h-4 w-4 text-hextech-cyan" />
				</motion.div>
			</SelectPrimitive.ItemIndicator>
		</motion.span>

		<SelectPrimitive.ItemText>
			<span className="truncate">{children}</span>
		</SelectPrimitive.ItemText>
	</SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<
	React.ElementRef<typeof SelectPrimitive.Separator>,
	React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
	<SelectPrimitive.Separator
		ref={ref}
		className={cn('-mx-1 my-1 h-px bg-white/10', className)}
		{...props}
	/>
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
	Select,
	SelectGroup,
	SelectValue,
	SelectTrigger,
	SelectContent,
	SelectLabel,
	SelectItem,
	SelectSeparator,
};
