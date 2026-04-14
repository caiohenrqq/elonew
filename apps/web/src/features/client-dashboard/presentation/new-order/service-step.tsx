import { Button } from '@packages/ui/components/button';
import { Label } from '@packages/ui/components/label';
import { Select } from '@packages/ui/components/select';
import { cn } from '@packages/ui/utils/cn';
import { ArrowRight, ChevronRight, ShieldCheck, Users } from 'lucide-react';
import {
	DIVISIONS,
	LEAGUES,
	SERVICE_TYPES,
	type ServiceTypeIcon,
} from '../../model/new-order-options';
import type { StartCheckoutInput } from '../../server/order-contracts';
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

			<div className="space-y-6">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div className="space-y-3">
						<Label htmlFor="current-league">Liga Atual</Label>
						<Select
							id="current-league"
							value={orderInput.currentLeague}
							onChange={(event) =>
								onChange('currentLeague', event.target.value)
							}
						>
							{LEAGUES.map((league) => (
								<option key={league.value} value={league.value}>
									{league.label}
								</option>
							))}
						</Select>
					</div>
					<div className="space-y-3">
						<Label htmlFor="current-division">Divisão Atual</Label>
						<Select
							id="current-division"
							value={orderInput.currentDivision}
							onChange={(event) =>
								onChange('currentDivision', event.target.value)
							}
						>
							{DIVISIONS.map((division) => (
								<option key={division} value={division}>
									{division}
								</option>
							))}
						</Select>
					</div>
				</div>

				<div className="flex justify-center">
					<ArrowRight className="text-white/10 w-6 h-6" />
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div className="space-y-3">
						<Label htmlFor="desired-league">Liga Desejada</Label>
						<Select
							id="desired-league"
							value={orderInput.desiredLeague}
							onChange={(event) =>
								onChange('desiredLeague', event.target.value)
							}
						>
							{LEAGUES.map((league) => (
								<option key={league.value} value={league.value}>
									{league.label}
								</option>
							))}
						</Select>
					</div>
					<div className="space-y-3">
						<Label htmlFor="desired-division">Divisão Desejada</Label>
						<Select
							id="desired-division"
							value={orderInput.desiredDivision}
							onChange={(event) =>
								onChange('desiredDivision', event.target.value)
							}
						>
							{DIVISIONS.map((division) => (
								<option key={division} value={division}>
									{division}
								</option>
							))}
						</Select>
					</div>
				</div>
			</div>

			<Button className="w-full" onClick={onNext}>
				Próximo Passo <ChevronRight className="ml-2 w-4 h-4" />
			</Button>
		</div>
	);
};
