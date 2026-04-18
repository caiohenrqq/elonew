'use client';

import { gsap, useGSAP } from '@packages/ui/animation/gsap';
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
import { cn } from '@packages/ui/utils/cn';
import { Target } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useRef } from 'react';
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

const formatCurrency = (value: number) => {
	return new Intl.NumberFormat('pt-BR', {
		style: 'currency',
		currency: 'BRL',
	}).format(value);
};

const AnimatedCurrency = ({
	className,
	value,
}: {
	className?: string;
	value: number | null;
}) => {
	const textRef = useRef<HTMLSpanElement>(null);
	const previousValue = useRef(value ?? 0);

	useGSAP(
		() => {
			if (value === null) {
				if (textRef.current) textRef.current.textContent = '...';
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
						textRef.current.textContent = formatCurrency(counter.value);
					}
				},
				onComplete: () => {
					previousValue.current = value;
					if (textRef.current) {
						textRef.current.textContent = formatCurrency(value);
					}
				},
			});
		},
		{ scope: textRef, dependencies: [value] },
	);

	return (
		<span ref={textRef} className={className}>
			{value === null ? '...' : formatCurrency(value)}
		</span>
	);
};

const CheckoutItemRow = ({
	label,
	value,
	priceLabel,
	className,
	containerClassName,
	labelClassName,
	valueClassName,
}: {
	label: string;
	value: number;
	priceLabel?: string;
	className?: string;
	containerClassName?: string;
	labelClassName?: string;
	valueClassName?: string;
}) => {
	return (
		<motion.div
			layout
			initial={{ opacity: 0, x: -15, height: 0, marginBottom: 0 }}
			animate={{ opacity: 1, x: 0, height: 'auto', marginBottom: 4 }}
			exit={{ opacity: 0, x: 15, height: 0, marginBottom: 0 }}
			transition={{
				type: 'spring',
				stiffness: 300,
				damping: 30,
				opacity: { duration: 0.2 },
			}}
			className={cn(
				'overflow-hidden flex justify-between gap-3 text-xs items-center',
				containerClassName || className,
			)}
		>
			<span className={cn('text-white/40', labelClassName)}>{label}</span>
			<span className={cn('font-black text-white/70', valueClassName)}>
				{value === 0 ? (
					'Grátis'
				) : (
					<span className="flex items-center gap-1.5">
						{priceLabel && (
							<span className="text-hextech-gold">{priceLabel}</span>
						)}
						<span
							className={cn(
								priceLabel ? 'text-[10px] opacity-40 font-medium' : '',
							)}
						>
							{priceLabel && '('}
							{value < 0 ? '- ' : ''}
							<AnimatedCurrency value={Math.abs(value)} />
							{priceLabel && ')'}
						</span>
					</span>
				)}
			</span>
		</motion.div>
	);
};

export const CheckoutSummary = ({
	isQuotePreviewPending = false,
	orderInput,
	onCouponCodeChange,
	quotePreview,
	quotePreviewError,
}: CheckoutSummaryProps) => {
	const allExtras = useMemo(() => quotePreview?.extras ?? [], [quotePreview]);

	const paidExtrasTotal = useMemo(
		() => allExtras.reduce((total, extra) => total + extra.price, 0),
		[allExtras],
	);

	const appliedCouponCode = useMemo(
		() =>
			orderInput.couponCode && quotePreview && quotePreview.discountAmount > 0
				? orderInput.couponCode
				: null,
		[orderInput.couponCode, quotePreview],
	);

	return (
		<aside className="w-full lg:w-[320px] sticky top-30">
			<Card className="overflow-hidden border-white/10 shadow-2xl">
				<div className="h-1 w-full bg-[var(--rank-accent)]" />
				<CardHeader>
					<CardTitle>Resumo de Checkout</CardTitle>
					<CardDescription>Cálculo em tempo real</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<motion.div layout className="space-y-3">
						<div className="flex justify-between text-xs">
							<span className="text-white/40 uppercase tracking-widest">
								Subtotal
							</span>
							<AnimatedCurrency
								className="font-black"
								value={quotePreview?.subtotal ?? null}
							/>
						</div>

						<div className="flex justify-between text-xs">
							<span className="text-white/40 uppercase tracking-widest">
								Taxa de Extras
							</span>
							<span className="font-black text-hextech-gold">
								{paidExtrasTotal > 0 ? (
									<AnimatedCurrency value={paidExtrasTotal} />
								) : allExtras.length > 0 ? (
									'Extras Selecionados'
								) : (
									'Sem extras'
								)}
							</span>
						</div>

						<AnimatePresence mode="popLayout" initial={false}>
							{allExtras.length > 0 && (
								<motion.div
									key="extras-container"
									initial={{ opacity: 0, scale: 0.95 }}
									animate={{ opacity: 1, scale: 1 }}
									exit={{ opacity: 0, scale: 0.95 }}
									className="space-y-1 rounded-sm bg-white/[0.02] p-3"
								>
									{allExtras.map((extra) => (
										<CheckoutItemRow
											key={extra.type}
											label={getExtraLabel(extra.type)}
											value={extra.price}
											priceLabel={
												EXTRA_OPTIONS_BY_ID.get(extra.type)?.priceLabel
											}
											className="text-[10px] text-white/45"
										/>
									))}
								</motion.div>
							)}
						</AnimatePresence>

						<AnimatePresence mode="popLayout">
							{quotePreview && quotePreview.discountAmount > 0 && (
								<CheckoutItemRow
									containerClassName="space-y-1 rounded-sm border border-emerald-400/10 bg-emerald-500/[0.04] p-3"
									label={
										appliedCouponCode
											? `Utilizando o cupom ${appliedCouponCode}`
											: 'Desconto'
									}
									value={-quotePreview.discountAmount}
									labelClassName={cn(
										'uppercase tracking-widest',
										appliedCouponCode
											? 'font-black text-emerald-300'
											: 'text-white/40',
									)}
									valueClassName="font-black text-emerald-400"
								/>
							)}
						</AnimatePresence>

						<motion.div
							layout
							className="pt-2 border-t border-white/5 flex justify-between"
						>
							<span className="text-xs font-black uppercase tracking-[0.2em] text-[var(--rank-accent)]">
								Total
							</span>
							<span className="text-xl font-black text-white">
								{quotePreview ? (
									<AnimatedCurrency value={quotePreview.totalAmount} />
								) : isQuotePreviewPending ? (
									'Calculando...'
								) : (
									'Indisponível'
								)}
							</span>
						</motion.div>

						{quotePreviewError && (
							<motion.p
								initial={{ opacity: 0, y: 5 }}
								animate={{ opacity: 1, y: 0 }}
								className="text-[10px] text-red-400 uppercase tracking-widest"
							>
								{quotePreviewError}
							</motion.p>
						)}
					</motion.div>

					<div className="space-y-2 pt-4 border-t border-white/5">
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
							<Button type="button" size="sm" variant="outline">
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
