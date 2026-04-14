import { Button } from '@packages/ui/components/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@packages/ui/components/card';
import { Input } from '@packages/ui/components/input';
import { Label } from '@packages/ui/components/label';
import { Target } from 'lucide-react';
import type { StartCheckoutInput } from '../../server/order-contracts';

type CheckoutSummaryProps = {
	orderInput: StartCheckoutInput;
	onCouponCodeChange?: (couponCode: string) => void;
};

export const CheckoutSummary = ({
	orderInput,
	onCouponCodeChange,
}: CheckoutSummaryProps) => {
	const selectedExtrasTotal = orderInput.extras.length * 10;

	return (
		<aside className="w-full lg:w-[320px] sticky top-30">
			<Card className="overflow-hidden border-white/10 shadow-2xl">
				<div className="h-1 w-full bg-hextech-cyan" />
				<CardHeader>
					<CardTitle>Resumo de Checkout</CardTitle>
					<CardDescription>Cálculo em tempo real</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<div className="flex justify-between text-xs">
							<span className="text-white/40 uppercase tracking-widest">
								Subtotal
							</span>
							<span className="font-black">Calculado no checkout</span>
						</div>
						<div className="flex justify-between text-xs">
							<span className="text-white/40 uppercase tracking-widest">
								Taxa de Extras
							</span>
							<span className="font-black text-hextech-gold">
								{selectedExtrasTotal > 0
									? `${selectedExtrasTotal}% selecionado`
									: 'Sem extras pagos'}
							</span>
						</div>
						<div className="pt-2 border-t border-white/5 flex justify-between">
							<span className="text-xs font-black uppercase tracking-[0.2em] text-hextech-cyan">
								Total
							</span>
							<span className="text-xl font-black text-white">
								No pagamento
							</span>
						</div>
					</div>

					<div className="space-y-2 pt-4">
						<Label htmlFor="coupon-code">Cupom de Desconto</Label>
						<div className="flex gap-2">
							<Input
								id="coupon-code"
								name="couponCode"
								value={orderInput.couponCode ?? ''}
								onChange={(event) =>
									onCouponCodeChange?.(event.target.value.toUpperCase())
								}
								placeholder="CÓDIGO"
								className="uppercase font-mono"
							/>
							<Button size="sm" variant="outline">
								Aplicar
							</Button>
						</div>
					</div>
				</CardContent>
				<CardFooter className="bg-white/[0.02] border-t border-white/5 py-4">
					<div className="flex items-center gap-2 opacity-40">
						<Target className="w-3 h-3" />
						<span className="text-[8px] font-black uppercase tracking-widest">
							Garantia de Entrega EloNew
						</span>
					</div>
				</CardFooter>
			</Card>
		</aside>
	);
};
