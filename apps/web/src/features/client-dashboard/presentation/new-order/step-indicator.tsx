import { cn } from '@packages/ui/utils/cn';

type StepIndicatorProps = {
	step: number;
};

export const StepIndicator = ({ step }: StepIndicatorProps) => {
	return (
		<ul className="flex items-center gap-4" aria-label="Progresso do pedido">
			{[1, 2, 3].map((currentStep) => (
				<li key={currentStep} className="flex items-center gap-2">
					<div
						className={cn(
							'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all duration-300 border',
							step >= currentStep
								? 'bg-hextech-cyan border-hextech-cyan text-white'
								: 'bg-white/5 border-white/10 text-white/20',
						)}
					>
						{currentStep}
					</div>
					{currentStep < 3 ? (
						<div
							className={cn(
								'w-10 h-px',
								step > currentStep ? 'bg-hextech-cyan' : 'bg-white/10',
							)}
						/>
					) : null}
				</li>
			))}
		</ul>
	);
};
