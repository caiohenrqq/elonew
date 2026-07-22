'use client';

import { Target } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { formatBRL } from '@/shared/format/currency';
import { gsap, useGSAP } from '@/shared/ui/animation/gsap';
import { Button } from '@/shared/ui/components/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/shared/ui/components/card';
import { Input } from '@/shared/ui/components/input';
import { Label } from '@/shared/ui/components/label';
import { cn } from '@/shared/ui/utils/cn';
import {
	EXTRA_OPTIONS_BY_ID,
	getExtraLabel,
} from '../../model/new-order-options';
import type {
	OrderQuotePreviewOutput,
	StartCheckoutInput,
} from '../../server/order-contracts';

type CheckoutSummaryProps = {
	isQuotePreviewPending?: boolean;
	orderInput: StartCheckoutInput;
	onCouponCodeChange?: (couponCode: string) => void;
	quotePreview: OrderQuotePreviewOutput | null;
	quotePreviewError?: string | null;
};

const Currency = ({ value }: { value: number | null }) => {
	const textRef = useRef<HTMLSpanElement>(null);
	const previousValue = useRef(value ?? 0);

	useGSAP(
		() => {
			if (value === null) {
				if (textRef.current) textRef.current.textContent = '...';
				return;
			}

			if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
				if (textRef.current) textRef.current.textContent = formatBRL(value);
				previousValue.current = value;
				return;
			}

			const counter = { value: previousValue.current };
			gsap.to(counter, {
				value,
				duration: 0.8,
				ease: 'expo.out',
				overwrite: 'auto',
				onUpdate: () => {
					if (textRef.current) {
						textRef.current.textContent = formatBRL(counter.value);
					}
				},
				onComplete: () => {
					previousValue.current = value;
				},
			});
		},
		{ scope: textRef, dependencies: [value] },
	);

	return <span ref={textRef}>{value === null ? '...' : formatBRL(value)}</span>;
};

const CheckoutItemRow = ({
	label,
	value,
	priceLabel,
	className,
}: {
	label: string;
	value: number | null;
	priceLabel?: string;
	className?: string;
}) => (
	<div
		className={cn('flex items-center justify-between gap-3 text-sm', className)}
	>
		<span className="text-white/65">{label}</span>
		<span className="text-right font-bold text-white/85">
			{value === null ? (
				<Currency value={null} />
			) : value === 0 ? (
				'Grátis'
			) : (
				<>
					{priceLabel ? (
						<span className="mr-1.5 text-hextech-gold">{priceLabel}</span>
					) : null}
					{value < 0 ? '- ' : ''}
					<Currency value={Math.abs(value)} />
				</>
			)}
		</span>
	</div>
);

export const CheckoutSummary = ({
	isQuotePreviewPending = false,
	orderInput,
	onCouponCodeChange,
	quotePreview,
	quotePreviewError,
}: CheckoutSummaryProps) => {
	const [couponDraft, setCouponDraft] = useState(orderInput.couponCode ?? '');
	const allExtras = quotePreview?.extras ?? [];
	const paidExtrasTotal = allExtras.reduce(
		(total, extra) => total + extra.price,
		0,
	);
	const appliedCouponCode =
		orderInput.couponCode && quotePreview && quotePreview.discountAmount > 0
			? orderInput.couponCode
			: null;
	const normalizedCouponDraft = couponDraft.trim().toUpperCase();
	const isCouponApplyDisabled =
		normalizedCouponDraft === (orderInput.couponCode ?? '') &&
		!quotePreviewError;

	useEffect(() => {
		setCouponDraft(orderInput.couponCode ?? '');
	}, [orderInput.couponCode]);

	const applyCouponCode = () => {
		onCouponCodeChange?.(normalizedCouponDraft);
	};

	return (
		<aside
			className="w-full lg:sticky lg:top-24 lg:w-80"
			aria-label="Resumo do checkout"
		>
			<Card className="overflow-hidden border-white/10">
				<div className="h-1 w-full bg-[var(--rank-accent)]" />
				<CardHeader>
					<CardTitle className="text-sm">Resumo de Checkout</CardTitle>
					<CardDescription className="text-sm text-white/60">
						Valores atualizados em tempo real
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-3">
						<CheckoutItemRow
							label="Subtotal"
							value={quotePreview?.subtotal ?? null}
						/>

						<div className="flex items-center justify-between gap-3 text-sm">
							<span className="text-white/65">Taxa de extras</span>
							<span className="text-right font-bold text-hextech-gold">
								{paidExtrasTotal > 0 ? (
									<Currency value={paidExtrasTotal} />
								) : allExtras.length > 0 ? (
									'Extras selecionados'
								) : (
									'Sem extras'
								)}
							</span>
						</div>

						{allExtras.length > 0 ? (
							<div className="space-y-2 rounded-sm bg-white/[0.03] p-3">
								{allExtras.map((extra) => (
									<CheckoutItemRow
										key={extra.type}
										label={getExtraLabel(extra.type)}
										value={extra.price}
										priceLabel={EXTRA_OPTIONS_BY_ID.get(extra.type)?.priceLabel}
									/>
								))}
							</div>
						) : null}

						{quotePreview && quotePreview.discountAmount > 0 ? (
							<CheckoutItemRow
								className="rounded-sm border border-success/20 bg-success/5 p-3"
								label={
									appliedCouponCode ? `Cupom ${appliedCouponCode}` : 'Desconto'
								}
								value={-quotePreview.discountAmount}
							/>
						) : null}

						<div className="flex items-center justify-between border-t border-white/10 pt-3">
							<span className="text-sm font-black uppercase tracking-widest text-[var(--rank-accent)]">
								Total
							</span>
							<span
								className="text-xl font-black text-white"
								aria-live="polite"
							>
								{quotePreview ? (
									<Currency value={quotePreview.totalAmount} />
								) : isQuotePreviewPending ? (
									'Calculando...'
								) : (
									'Indisponível'
								)}
							</span>
						</div>

						{quotePreviewError ? (
							<p className="text-sm text-red-300" role="alert">
								{quotePreviewError}
							</p>
						) : null}
					</div>

					<div className="space-y-2 border-t border-white/10 pt-4">
						<Label htmlFor="coupon-code">Cupom de desconto</Label>
						<div className="flex gap-2">
							<Input
								id="coupon-code"
								name="couponCode"
								value={couponDraft}
								onChange={(event) =>
									setCouponDraft(event.target.value.toUpperCase())
								}
								onKeyDown={(event) => {
									if (event.key !== 'Enter') return;
									event.preventDefault();
									applyCouponCode();
								}}
								placeholder="CÓDIGO"
								className="h-12 font-mono text-base uppercase md:text-sm"
							/>
							<Button
								type="button"
								size="lg"
								variant="outline"
								disabled={isCouponApplyDisabled}
								onClick={applyCouponCode}
							>
								Aplicar
							</Button>
						</div>
					</div>
				</CardContent>
				<CardFooter className="border-t border-white/10 bg-white/[0.02] py-4">
					<div className="flex items-center gap-2 text-white/60">
						<Target className="h-4 w-4" aria-hidden="true" />
						<span className="text-xs font-bold uppercase tracking-widest">
							Garantia de entrega EloNew
						</span>
					</div>
				</CardFooter>
			</Card>
		</aside>
	);
};
