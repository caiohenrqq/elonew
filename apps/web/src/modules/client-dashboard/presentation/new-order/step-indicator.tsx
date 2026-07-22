import { Check } from 'lucide-react';
import { cn } from '@/shared/ui/utils/cn';

type StepIndicatorProps = {
	step: number;
};

const STEPS = [
	{ number: 1, label: 'Serviço' },
	{ number: 2, label: 'Detalhes' },
	{ number: 3, label: 'Conta' },
	{ number: 4, label: 'Revisão' },
] as const;

export const StepIndicator = ({ step }: StepIndicatorProps) => {
	const currentStep = STEPS[step - 1] ?? STEPS[0];

	return (
		<nav aria-label="Progresso do pedido" className="space-y-3">
			<p className="text-sm font-medium text-white/70" aria-live="polite">
				Etapa {step} de {STEPS.length}:{' '}
				<span className="font-bold text-white">{currentStep.label}</span>
			</p>
			<ol className="grid grid-cols-4 gap-2">
				{STEPS.map((item) => {
					const isCurrent = step === item.number;
					const isComplete = step > item.number;

					return (
						<li
							key={item.number}
							aria-label={`Etapa ${item.number}: ${item.label}`}
							aria-current={isCurrent ? 'step' : undefined}
							className="min-w-0"
						>
							<div
								className={cn(
									'h-1 rounded-sm bg-white/10',
									(isCurrent || isComplete) && 'bg-hextech-cyan',
								)}
							/>
							<div className="mt-2 flex items-center gap-2">
								<span
									className={cn(
										'flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border text-xs font-black',
										isCurrent &&
											'border-hextech-cyan bg-hextech-cyan text-white',
										isComplete &&
											'border-hextech-cyan/50 bg-hextech-cyan/10 text-hextech-cyan',
										!isCurrent &&
											!isComplete &&
											'border-white/15 bg-white/5 text-white/50',
									)}
								>
									{isComplete ? (
										<Check className="h-4 w-4" aria-hidden="true" />
									) : (
										item.number
									)}
								</span>
								<span
									className={cn(
										'hidden truncate text-xs font-bold sm:block',
										isCurrent || isComplete ? 'text-white' : 'text-white/50',
									)}
								>
									{item.label}
								</span>
							</div>
						</li>
					);
				})}
			</ol>
		</nav>
	);
};
