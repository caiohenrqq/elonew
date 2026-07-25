import { ChevronRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/shared/ui/components/button';
import { Input } from '@/shared/ui/components/input';
import { Label } from '@/shared/ui/components/label';

type AccountStepProps = {
	summonerName: string;
	onBack: () => void;
	onChange: (summonerName: string) => void;
	onNext: () => void;
	onNextIntent?: () => void;
};

export const AccountStep = ({
	summonerName,
	onBack,
	onChange,
	onNext,
	onNextIntent,
}: AccountStepProps) => {
	const canContinue = summonerName.trim().length > 0;

	return (
		<div className="space-y-8">
			<div className="space-y-2">
				<h2 className="text-xl font-black uppercase tracking-[0.2em]">Conta</h2>
				<p className="text-sm leading-relaxed text-white/65">
					Informe o invocador que receberá o boost.
				</p>
			</div>

			<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
				<div className="space-y-3">
					<Label htmlFor="summoner-name">
						Nome de invocador <span aria-hidden="true">*</span>
					</Label>
					<Input
						id="summoner-name"
						name="summonerName"
						value={summonerName}
						onChange={(event) => onChange(event.target.value)}
						autoComplete="off"
						maxLength={64}
						aria-describedby="summoner-name-help"
						className="h-12 text-base md:text-sm"
						required
					/>
					<p id="summoner-name-help" className="text-sm text-white/55">
						Você poderá ajustar este nome ao enviar o acesso.
					</p>
				</div>
			</div>

			<aside className="border border-hextech-gold/30 bg-hextech-gold/5 p-4">
				<div className="flex items-center gap-2 text-hextech-gold">
					<ShieldCheck className="h-5 w-5" aria-hidden="true" />
					<h3 className="text-sm font-black uppercase tracking-widest">
						Sobre o acesso à sua conta
					</h3>
				</div>
				<ol className="mt-4 space-y-3 text-sm leading-relaxed text-white/75">
					<li className="border-b border-white/10 pb-3">
						<span className="mr-2 font-black text-hextech-gold">1.</span>
						Login e senha não são pedidos agora. Assim que o pagamento for
						confirmado, a página do pedido solicita o acesso com segurança.
					</li>
					<li className="border-b border-white/10 pb-3">
						<span className="mr-2 font-black text-hextech-gold">2.</span>
						Antes de enviar o acesso, recomendamos que você troque para uma
						senha nova.
					</li>
					<li>
						<span className="mr-2 font-black text-hextech-gold">3.</span>
						Quando o boost terminar, crie outra senha nova e exclusiva.
					</li>
				</ol>
			</aside>

			<div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:justify-end">
				<Button
					variant="outline"
					size="lg"
					className="w-full sm:w-auto"
					onClick={onBack}
				>
					Voltar
				</Button>
				<Button
					size="lg"
					onClick={onNext}
					onFocus={onNextIntent}
					onMouseEnter={onNextIntent}
					className="w-full sm:w-auto"
					disabled={!canContinue}
				>
					Revisar Pedido
					<ChevronRight className="ml-2 h-4 w-4" aria-hidden="true" />
				</Button>
			</div>
		</div>
	);
};
