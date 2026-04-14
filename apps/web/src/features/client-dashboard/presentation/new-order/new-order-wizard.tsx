'use client';

import { AnimatePresence } from 'motion/react';
import { useState, useTransition } from 'react';
import { startCheckoutAction } from '../../actions/order-actions';
import { createInitialCheckoutInput } from '../../model/checkout-defaults';
import type { StartCheckoutInput } from '../../server/order-contracts';
import { CheckoutSummary } from './checkout-summary';
import { DetailsStep } from './details-step';
import { ReviewStep } from './review-step';
import { ServiceStep } from './service-step';
import { StepIndicator } from './step-indicator';
import { WizardStepTransition } from './wizard-step-transition';

const INITIAL_STEP = 1;

export const NewOrderWizard = () => {
	const [step, setStep] = useState(INITIAL_STEP);
	const [orderInput, setOrderInput] = useState<StartCheckoutInput>(
		createInitialCheckoutInput,
	);
	const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
	const [checkoutError, setCheckoutError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	const updateOrderInput = <Key extends keyof StartCheckoutInput>(
		key: Key,
		value: StartCheckoutInput[Key],
	) => {
		setOrderInput((previousInput) => ({ ...previousInput, [key]: value }));
	};

	const toggleExtra = (id: string) => {
		setOrderInput((previousInput) => ({
			...previousInput,
			extras: previousInput.extras.includes(id)
				? previousInput.extras.filter((extra) => extra !== id)
				: [...previousInput.extras, id],
		}));
	};

	const handleCheckout = () => {
		if (!hasAcceptedTerms) {
			setCheckoutError('Confirme os termos para continuar.');
			return;
		}

		setCheckoutError(null);
		startTransition(async () => {
			const result = await startCheckoutAction(orderInput);
			if (result.error) {
				setCheckoutError(result.error);
				return;
			}

			if (result.checkoutUrl) window.location.assign(result.checkoutUrl);
		});
	};

	return (
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
				onCouponCodeChange={(couponCode) =>
					updateOrderInput('couponCode', couponCode || undefined)
				}
			/>
		</div>
	);
};
