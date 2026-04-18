import { Button } from '@packages/ui/components/button';
import { cn } from '@packages/ui/utils/cn';
import { ChevronRight, ShieldCheck, Users } from 'lucide-react';
import {
	SERVICE_TYPES,
	type ServiceTypeIcon,
} from '../../model/new-order-options';
import { isDesiredRankAvailable } from '../../model/rank-options';
import type { StartCheckoutInput } from '../../server/order-contracts';
import { RankRoutePicker } from './rank-route-picker';
import { SelectableOption } from './selectable-option';

const SERVICE_ICONS = {
	shield: ShieldCheck,
	users: Users,
} satisfies Record<ServiceTypeIcon, typeof ShieldCheck>;

type ServiceStepProps = {
	orderInput: StartCheckoutInput;
	onChange: <Key extends keyof StartCheckoutInput>(
		key: Key,
		value: StartCheckoutInput[Key],
	) => void;
	onNext: () => void;
};

export const ServiceStep = ({
	orderInput,
	onChange,
	onNext,
}: ServiceStepProps) => {
	const canContinue = isDesiredRankAvailable(
		orderInput.currentLeague,
		orderInput.currentDivision,
		orderInput.desiredLeague,
		orderInput.desiredDivision,
	);

	return (
		<div className="space-y-8">
			<div className="space-y-2">
				<h2 className="text-xl font-black uppercase tracking-[0.2em]">
					Selecione o Serviço
				</h2>
				<p className="text-white/40 text-xs">
					Escolha a modalidade de subida desejada.
				</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{SERVICE_TYPES.map((type) => {
					const Icon = SERVICE_ICONS[type.icon];
					const isSelected = orderInput.serviceType === type.id;

					return (
						<SelectableOption
							key={type.id}
							onClick={() =>
								onChange(
									'serviceType',
									type.id as StartCheckoutInput['serviceType'],
								)
							}
							selected={isSelected}
						>
							<Icon
								className={cn(
									'w-8 h-8 mb-4 transition-colors',
									isSelected
										? 'text-hextech-cyan'
										: 'text-white/20 group-hover:text-white/40',
								)}
							/>
							<h3 className="font-black uppercase tracking-widest text-xs mb-1">
								{type.label}
							</h3>
							<p className="text-[10px] text-white/40 leading-relaxed">
								{type.description}
							</p>
						</SelectableOption>
					);
				})}
			</div>

			<RankRoutePicker orderInput={orderInput} onChange={onChange} />

			<div className="flex justify-end pt-6 border-t border-white/5 mt-8">
				<Button
					type="button"
					onClick={onNext}
					className="group"
					disabled={!canContinue}
				>
					Próximo Passo
					<ChevronRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
				</Button>
			</div>
		</div>
	);
};
