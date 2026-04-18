'use client';

import { gsap, useGSAP } from '@packages/ui/animation/gsap';
import { AnimatePresence } from 'motion/react';
import dynamic from 'next/dynamic';
import type { CSSProperties } from 'react';
import { useCallback, useRef, useState } from 'react';
import { createInitialCheckoutInput } from '../../model/checkout-defaults';
import { getRankOption } from '../../model/rank-options';
import type { StartCheckoutInput } from '../../server/order-contracts';
import { CheckoutSummary } from './checkout-summary';
import { StepIndicator } from './step-indicator';
import { useCheckoutSubmit } from './use-checkout-submit';
import { useQuotePreview } from './use-quote-preview';
import { WizardStepTransition } from './wizard-step-transition';

const ServiceStep = dynamic(() =>
	import('./service-step').then((m) => m.ServiceStep),
);
const DetailsStep = dynamic(() =>
	import('./details-step').then((m) => m.DetailsStep),
);
const ReviewStep = dynamic(() =>
	import('./review-step').then((m) => m.ReviewStep),
);

const INITIAL_STEP = 1;

export const NewOrderWizard = () => {
	const [step, setStep] = useState(INITIAL_STEP);
	const [orderInput, setOrderInput] = useState<StartCheckoutInput>(
		createInitialCheckoutInput,
	);
	const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
	const selectedRank = getRankOption(orderInput.desiredLeague);
	const initialRank = useRef(selectedRank);
	const wizardRef = useRef<HTMLDivElement>(null);
	const { isQuotePreviewPending, quotePreview, quotePreviewError } =
		useQuotePreview(orderInput);
	const { checkoutError, handleCheckout, isPending } = useCheckoutSubmit({
		hasAcceptedTerms,
		orderInput,
	});

	useGSAP(
		() => {
			gsap.to(wizardRef.current, {
				'--rank-accent': selectedRank.accent,
				'--rank-accent-soft': selectedRank.accentSoft,
				duration: 0.85,
				ease: 'expo.out',
				overwrite: 'auto',
			});
		},
		{ scope: wizardRef, dependencies: [selectedRank] },
	);

	const updateOrderInput = useCallback(
		<Key extends keyof StartCheckoutInput>(
			key: Key,
			value: StartCheckoutInput[Key],
		) => {
			setOrderInput((previousInput) => {
				const newInput = { ...previousInput, [key]: value };

				if (key === 'lpGain') {
					const lpGain = value as number;
					const shouldHaveNerfedMmr = lpGain <= 17;
					const hasNerfedMmr = newInput.extras.includes('mmr_nerfed');

					if (shouldHaveNerfedMmr && !hasNerfedMmr) {
						newInput.extras = [...newInput.extras, 'mmr_nerfed'];
					} else if (!shouldHaveNerfedMmr && hasNerfedMmr) {
						newInput.extras = newInput.extras.filter(
							(id) => id !== 'mmr_nerfed',
						);
					}
				}

				return newInput;
			});
		},
		[],
	);

	const toggleExtra = useCallback((id: string) => {
		setOrderInput((previousInput) => ({
			...previousInput,
			extras: previousInput.extras.includes(id)
				? previousInput.extras.filter((extra) => extra !== id)
				: [...previousInput.extras, id],
		}));
	}, []);

	return (
		<div
			ref={wizardRef}
			className="relative -m-4 rounded-sm border border-white/5 p-4"
			style={
				{
					'--rank-accent': initialRank.current.accent,
					'--rank-accent-soft': initialRank.current.accentSoft,
					background:
						'linear-gradient(145deg, var(--rank-accent-soft), transparent 34%), #09090b',
				} as CSSProperties
			}
		>
			<div className="flex flex-col lg:flex-row gap-10 items-start">
				<div className="flex-1 space-y-10">
					<StepIndicator step={step} />

					<AnimatePresence mode="wait">
						{step === 1 ? (
							<WizardStepTransition stepKey="step1">
								<ServiceStep
									orderInput={orderInput}
									onChange={updateOrderInput}
									onNext={() => setStep(2)}
								/>
							</WizardStepTransition>
						) : null}

						{step === 2 ? (
							<WizardStepTransition stepKey="step2">
								<DetailsStep
									orderInput={orderInput}
									onBack={() => setStep(1)}
									onNext={() => setStep(3)}
									onChange={updateOrderInput}
									onToggleExtra={toggleExtra}
								/>
							</WizardStepTransition>
						) : null}

						{step === 3 ? (
							<WizardStepTransition stepKey="step3">
								<ReviewStep
									orderInput={orderInput}
									hasAcceptedTerms={hasAcceptedTerms}
									onBack={() => setStep(2)}
									onCheckout={handleCheckout}
									onTermsChange={setHasAcceptedTerms}
									isSubmitting={isPending}
									error={checkoutError}
								/>
							</WizardStepTransition>
						) : null}
					</AnimatePresence>
				</div>

				<CheckoutSummary
					orderInput={orderInput}
					quotePreview={quotePreview}
					quotePreviewError={quotePreviewError}
					isQuotePreviewPending={isQuotePreviewPending}
					onCouponCodeChange={(couponCode) =>
						updateOrderInput('couponCode', couponCode || undefined)
					}
				/>
			</div>
		</div>
	);
};
