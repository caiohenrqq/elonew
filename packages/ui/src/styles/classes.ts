import { cn } from '../utils/cn';

export const focusRing =
	'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-hextech-cyan';

export const disabledState = 'disabled:pointer-events-none disabled:opacity-50';

export const labelText = {
	control:
		'text-[10px] font-black uppercase tracking-[0.2em] leading-none text-white/40',
	nav: 'text-[10px] font-black uppercase tracking-[0.3em]',
	eyebrow: 'text-[10px] font-black uppercase tracking-[0.4em]',
};

export const panelSurface = {
	base: 'rounded-sm border border-white/5 bg-surface/50',
	interactive:
		'rounded-sm border border-white/5 bg-surface-muted transition-colors duration-500 hover:border-hextech-cyan/40',
};

export const fieldSurface = cn(
	'flex h-10 w-full rounded-sm border border-white/10 bg-white/5 px-3 py-2 text-xs text-white ring-offset-black transition-all duration-200',
	'placeholder:text-white/20 focus-visible:border-hextech-cyan',
	focusRing,
	'disabled:cursor-not-allowed disabled:opacity-50',
);

export const navTextButton = cn(
	'inline-flex cursor-pointer appearance-none items-center border-0 bg-transparent p-0 font-[inherit] uppercase leading-[inherit] tracking-[inherit] text-white/60 transition-colors duration-300',
	'hover:text-hextech-cyan focus-visible:text-hextech-cyan',
	focusRing,
);
