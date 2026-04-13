import type { ProcessStep } from '../model/process-steps';

type ProcessStepCardProps = {
	step: ProcessStep;
};

export function ProcessStepCard({ step }: ProcessStepCardProps) {
	return (
		<div className="step-card flex-shrink-0 w-[80vw] md:w-[35vw] flex flex-col justify-center">
			<span className="text-7xl md:text-[10rem] font-black text-white/[0.05] leading-none mb-4 block select-none">
				{step.number}
			</span>
			<div className="max-w-md">
				<h4 className="text-2xl md:text-3xl font-black uppercase mb-4 tracking-tight text-[#0ea5e9]">
					{step.title}
				</h4>
				<p className="text-sm md:text-base text-white/50 leading-relaxed font-medium">
					{step.description}
				</p>
			</div>
		</div>
	);
}
