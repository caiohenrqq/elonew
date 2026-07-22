'use client';

import type { OrderExtraType } from '@packages/shared/orders/order-extra';
import dynamic from 'next/dynamic';
import type { CSSProperties } from 'react';
import { useCallback, useRef, useState } from 'react';
import { gsap, useGSAP } from '@/shared/ui/animation/gsap';
import { createInitialCheckoutInput } from '../../model/checkout-defaults';
import { getRankOption } from '../../model/rank-options';
import type { StartCheckoutInput } from '../../server/order-contracts';
import type { AccountInput } from './account-step';
import { CheckoutSummary } from './checkout-summary';
import { StepIndicator } from './step-indicator';
import { useCheckoutSubmit } from './use-checkout-submit';
import { useQuotePreview } from './use-quote-preview';
import { WizardStepTransition } from './wizard-step-transition';

const loadServiceStep = () =>
	import('./service-step').then((module) => module.ServiceStep);
const loadDetailsStep = () =>
	import('./details-step').then((module) => module.DetailsStep);
const loadAccountStep = () =>
	import('./account-step').then((module) => module.AccountStep);
const loadReviewStep = () =>
	import('./review-step').then((module) => module.ReviewStep);

const ServiceStep = dynamic(loadServiceStep);
const DetailsStep = dynamic(loadDetailsStep);
const AccountStep = dynamic(loadAccountStep);
const ReviewStep = dynamic(loadReviewStep);

const INITIAL_STEP = 1;
const INITIAL_ACCOUNT_INPUT: AccountInput = {
	login: '',
	summonerName: '',
	password: '',
	passwordConfirmation: '',
};

export const NewOrderWizard = () => {
	const [step, setStep] = useState(INITIAL_STEP);
	const [orderInput, setOrderInput] = useState<StartCheckoutInput>(
		createInitialCheckoutInput,
	);
	const [accountInput, setAccountInput] = useState(INITIAL_ACCOUNT_INPUT);
	const [favoriteBoosterName, setFavoriteBoosterName] = useState('');
	const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
	const selectedRank = getRankOption(orderInput.desiredLeague);
	const initialRank = useRef(selectedRank);
	const wizardRef = useRef<HTMLDivElement>(null);
	const [couponApplyNonce, setCouponApplyNonce] = useState(0);
	const { isQuotePreviewPending, quotePreview, quotePreviewError } =
		useQuotePreview(orderInput, couponApplyNonce);
	const { checkoutError, handleCheckout, isPending } = useCheckoutSubmit({
		hasAcceptedTerms,
		orderInput,
	});

	const preloadDetailsStep = useCallback(() => {
		void loadDetailsStep();
	}, []);

	const preloadAccountStep = useCallback(() => {
		void loadAccountStep();
	}, []);

	const preloadReviewStep = useCallback(() => {
		void loadReviewStep();
	}, []);

	useGSAP(
		() => {
			if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

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

	const toggleExtra = useCallback(
		(id: OrderExtraType) => {
			if (
				id === 'favorite_booster' &&
				orderInput.extras.includes('favorite_booster')
			) {
				setFavoriteBoosterName('');
			}

			setOrderInput((previousInput) => ({
				...previousInput,
				extras: previousInput.extras.includes(id)
					? previousInput.extras.filter((extra) => extra !== id)
					: [...previousInput.extras, id],
			}));
		},
		[orderInput.extras],
	);

	const updateAccountInput = useCallback(
		(key: keyof AccountInput, value: string) => {
			setAccountInput((previousInput) => ({
				...previousInput,
				[key]: value,
			}));
		},
		[],
	);

	const handleCouponCodeChange = useCallback(
		(couponCode: string) => {
			updateOrderInput('couponCode', couponCode || undefined);
			setCouponApplyNonce((nonce) => nonce + 1);
		},
		[updateOrderInput],
	);

	return (
		<div
			ref={wizardRef}
			className="relative -m-4 rounded-sm border border-white/5 p-4"
			style={
				{
					'--rank-accent': initialRank.current.accent,
					'--rank-accent-soft': initialRank.current.accentSoft,
					background:
						'linear-gradient(145deg, var(--rank-accent-soft), transparent 34%), var(--color-background)',
				} as CSSProperties
			}
		>
			<div className="flex flex-col lg:flex-row gap-10 items-start">
				<div className="flex-1 space-y-10">
					<StepIndicator step={step} />

					<div>
						{step === 1 ? (
							<WizardStepTransition stepKey="step1">
								<ServiceStep
									orderInput={orderInput}
									onChange={updateOrderInput}
									onNext={() => setStep(2)}
									onNextIntent={preloadDetailsStep}
								/>
							</WizardStepTransition>
						) : null}

						{step === 2 ? (
							<WizardStepTransition stepKey="step2">
								<DetailsStep
									favoriteBoosterName={favoriteBoosterName}
									orderInput={orderInput}
									onBack={() => setStep(1)}
									onNext={() => setStep(3)}
									onNextIntent={preloadAccountStep}
									onChange={updateOrderInput}
									onToggleExtra={toggleExtra}
									onFavoriteBoosterNameChange={setFavoriteBoosterName}
								/>
							</WizardStepTransition>
						) : null}

						{step === 3 ? (
							<WizardStepTransition stepKey="step3">
								<AccountStep
									accountInput={accountInput}
									onBack={() => setStep(2)}
									onChange={updateAccountInput}
									onNext={() => setStep(4)}
									onNextIntent={preloadReviewStep}
								/>
							</WizardStepTransition>
						) : null}

						{step === 4 ? (
							<WizardStepTransition stepKey="step4">
								<ReviewStep
									accountInput={accountInput}
									favoriteBoosterName={favoriteBoosterName}
									orderInput={orderInput}
									hasAcceptedTerms={hasAcceptedTerms}
									onBack={() => setStep(3)}
									onCheckout={handleCheckout}
									onTermsChange={setHasAcceptedTerms}
									isSubmitting={isPending}
									error={checkoutError}
								/>
							</WizardStepTransition>
						) : null}
					</div>
				</div>

				<CheckoutSummary
					orderInput={orderInput}
					quotePreview={quotePreview}
					quotePreviewError={quotePreviewError}
					isQuotePreviewPending={isQuotePreviewPending}
					onCouponCodeChange={handleCouponCodeChange}
				/>
			</div>
		</div>
	);
};
