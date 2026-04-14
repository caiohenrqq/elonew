import { Badge } from '@packages/ui/components/badge';
import { Button } from '@packages/ui/components/button';
import { Input } from '@packages/ui/components/input';
import { Label } from '@packages/ui/components/label';
import { Select } from '@packages/ui/components/select';
import { cn } from '@packages/ui/utils/cn';
import { CheckCircle2 } from 'lucide-react';
import { EXTRAS, QUEUES, SERVERS } from '../../model/new-order-options';
import type { StartCheckoutInput } from '../../server/order-contracts';
import { SelectableOption } from './selectable-option';

type DetailsStepProps = {
	orderInput: StartCheckoutInput;
	onBack: () => void;
	onNext: () => void;
	onChange: <Key extends keyof StartCheckoutInput>(
		key: Key,
		value: StartCheckoutInput[Key],
	) => void;
	onToggleExtra: (extraId: string) => void;
};

export const DetailsStep = ({
	orderInput,
	onBack,
	onNext,
	onChange,
	onToggleExtra,
}: DetailsStepProps) => {
	return (
		<div className="space-y-8">
			<div className="space-y-2">
				<h2 className="text-xl font-black uppercase tracking-[0.2em]">
					Detalhes e Extras
				</h2>
				<p className="text-white/40 text-xs">
					Configure os detalhes técnicos do seu pedido.
				</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<div className="space-y-3">
					<Label htmlFor="server">Servidor</Label>
					<Select
						id="server"
						value={orderInput.server}
						onChange={(event) => onChange('server', event.target.value)}
					>
						{SERVERS.map((server) => (
							<option key={server.value} value={server.value}>
								{server.label}
							</option>
						))}
					</Select>
				</div>
				<div className="space-y-3">
					<Label htmlFor="queue">Fila</Label>
					<Select
						id="queue"
						value={orderInput.desiredQueue}
						onChange={(event) => onChange('desiredQueue', event.target.value)}
					>
						{QUEUES.map((queue) => (
							<option key={queue.value} value={queue.value}>
								{queue.label}
							</option>
						))}
					</Select>
				</div>
				<div className="space-y-3">
					<Label htmlFor="lp-gain">Ganho de PDL (Aprox.)</Label>
					<Input
						id="lp-gain"
						name="lpGain"
						type="number"
						min={1}
						value={orderInput.lpGain}
						onChange={(event) => onChange('lpGain', Number(event.target.value))}
						placeholder="20"
					/>
				</div>
			</div>

			<div className="space-y-4">
				<Label>Personalize sua experiência</Label>
				<div className="grid grid-cols-1 gap-2">
					{EXTRAS.map((extra) => {
						const isSelected = orderInput.extras.includes(extra.id);

						return (
							<SelectableOption
								key={extra.id}
								onClick={() => onToggleExtra(extra.id)}
								layout="row"
								selected={isSelected}
							>
								<div className="flex items-center gap-3">
									<div
										className={cn(
											'w-4 h-4 rounded-sm border flex items-center justify-center transition-colors',
											isSelected
												? 'bg-hextech-cyan border-hextech-cyan'
												: 'border-white/20',
										)}
									>
										{isSelected ? (
											<CheckCircle2 className="w-3 h-3 text-black" />
										) : null}
									</div>
									<span className="text-[10px] font-black uppercase tracking-widest">
										{extra.label}
									</span>
								</div>
								<Badge
									variant={extra.price === 'Grátis' ? 'success' : 'warning'}
								>
									{extra.price}
								</Badge>
							</SelectableOption>
						);
					})}
				</div>
			</div>

			<div className="flex gap-4">
				<Button variant="outline" className="flex-1" onClick={onBack}>
					Voltar
				</Button>
				<Button className="flex-[2]" onClick={onNext}>
					Revisar Pedido
				</Button>
			</div>
		</div>
	);
};
