import { cn } from '@packages/ui/utils/cn';

type StepIndicatorProps = {
	step: number;
};

const STEPS = [
	{ number: 1, label: 'Serviço' },
	{ number: 2, label: 'Detalhes' },
	{ number: 3, label: 'Revisão' },
] as const;

export const StepIndicator = ({ step }: StepIndicatorProps) => {
	return (
		<ul
			className="flex flex-wrap items-center gap-3"
			aria-label="Progresso do pedido"
		>
			{STEPS.map((currentStep) => (
				<li key={currentStep.number} className="flex items-center gap-2">
					<div
						className={cn(
							'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all duration-300 border',
							step >= currentStep.number
								? 'bg-hextech-cyan border-hextech-cyan text-white'
								: 'bg-white/5 border-white/10 text-white/20',
						)}
					>
						{currentStep.number}
					</div>
					<span
						className={cn(
							'text-[10px] font-black uppercase tracking-[0.16em] transition-colors',
							step >= currentStep.number ? 'text-white' : 'text-white/25',
						)}
					>
						{currentStep.label}
					</span>
					{currentStep.number < STEPS.length ? (
						<div
							className={cn(
								'w-8 h-px',
								step > currentStep.number ? 'bg-hextech-cyan' : 'bg-white/10',
							)}
						/>
					) : null}
				</li>
			))}
		</ul>
	);
};
