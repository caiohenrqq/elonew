'use client';

import { getButtonClassName } from '@packages/ui/components/button';
import {
	Check,
	Copy,
	Eye,
	EyeOff,
	KeyRound,
	ShieldCheck,
	Terminal,
	X,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

type DevelopmentCheckoutModalProps = {
	devPaymentId: string;
};

type CopySnippetProps = {
	label: string;
	value: string;
	display?: string;
	maskedDisplay?: string;
	codeClassName?: string;
};

const approvedOutcomeBody = JSON.stringify({ outcome: 'approved' }, null, 2);
const loginBody = JSON.stringify(
	{
		email: 'client@elojob.com',
		password: 'DevPassword123!',
	},
	null,
	2,
);
const maskedLoginBody = JSON.stringify(
	{
		email: 'client@elojob.com',
		password: '•••••••••••••••',
	},
	null,
	2,
);

const acceptedOutcomes = [
	'approved',
	'rejected',
	'cancelled',
	'pending',
	'in_process',
	'authorized',
];

const accessTokenPlaceholder = 'Authorization: Bearer <accessToken>';

const CopySnippet = ({
	label,
	value,
	display = value,
	maskedDisplay,
	codeClassName,
}: CopySnippetProps) => {
	const [copied, setCopied] = useState(false);
	const [revealed, setRevealed] = useState(!maskedDisplay);
	const displayedValue = revealed ? display : maskedDisplay;

	const copyValue = async () => {
		await navigator.clipboard.writeText(value);
		setCopied(true);
		window.setTimeout(() => setCopied(false), 1400);
	};

	return (
		<div className="group/snippet min-w-0 overflow-hidden rounded-sm border border-white/10 bg-black/25">
			<div className="flex min-h-9 items-center justify-between gap-3 border-b border-white/10 bg-white/[0.03] px-3">
				<span className="text-[9px] font-black uppercase tracking-[0.22em] text-white/35">
					{label}
				</span>
				<div className="flex items-center gap-1">
					{maskedDisplay ? (
						<button
							type="button"
							onClick={() => setRevealed((current) => !current)}
							aria-label={revealed ? `Hide ${label}` : `Show ${label}`}
							className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-sm text-white/45 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-hextech-cyan"
						>
							{revealed ? (
								<EyeOff className="h-3.5 w-3.5" />
							) : (
								<Eye className="h-3.5 w-3.5" />
							)}
						</button>
					) : null}
					<button
						type="button"
						onClick={copyValue}
						aria-label={`Copy ${label}`}
						className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-sm text-white/45 transition-colors hover:bg-hextech-cyan/10 hover:text-hextech-cyan focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-hextech-cyan"
					>
						{copied ? (
							<Check className="h-3.5 w-3.5" />
						) : (
							<Copy className="h-3.5 w-3.5" />
						)}
					</button>
				</div>
			</div>
			<pre
				className={`max-h-32 min-w-0 overflow-x-auto overflow-y-hidden whitespace-pre px-3 py-3 font-mono text-[11px] leading-5 text-amber-100 [scrollbar-color:rgba(14,165,233,0.65)_rgba(255,255,255,0.06)] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:rounded-sm [&::-webkit-scrollbar-track]:bg-white/[0.06] [&::-webkit-scrollbar-thumb]:rounded-sm [&::-webkit-scrollbar-thumb]:border [&::-webkit-scrollbar-thumb]:border-black/30 [&::-webkit-scrollbar-thumb]:bg-hextech-cyan/60 [&::-webkit-scrollbar-thumb:hover]:bg-hextech-cyan ${codeClassName ?? ''}`}
			>
				{displayedValue}
			</pre>
		</div>
	);
};

export const DevelopmentCheckoutModal = ({
	devPaymentId,
}: DevelopmentCheckoutModalProps) => {
	const simulationPath = `/payments/dev/${devPaymentId}/simulate`;

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-[#05070a]/85 px-4 py-6 backdrop-blur-md"
			role="dialog"
			aria-modal="true"
			aria-labelledby="dev-payment-modal-title"
		>
			<div className="relative max-h-[calc(100vh-3rem)] w-full max-w-5xl overflow-y-auto rounded-sm border border-hextech-cyan/20 bg-[#090d12] text-white shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
				<div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-hextech-cyan to-transparent" />
				<div className="grid gap-0 md:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
					<div className="min-w-0 border-b border-white/10 bg-[linear-gradient(135deg,rgba(14,165,233,0.14),rgba(245,158,11,0.05)_45%,rgba(255,255,255,0.02))] p-5 md:border-r md:border-b-0">
						<div className="flex items-start justify-between gap-4">
							<div className="flex h-9 w-9 items-center justify-center rounded-sm border border-hextech-cyan/25 bg-hextech-cyan/10">
								<Terminal className="h-4 w-4 text-hextech-cyan" />
							</div>
							<Link
								href="/client"
								aria-label="Close development checkout"
								className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-white/45 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-hextech-cyan"
							>
								<X className="h-4 w-4" />
							</Link>
						</div>

						<div className="mt-7 space-y-5">
							<div className="space-y-2">
								<p className="text-[9px] font-black uppercase tracking-[0.32em] text-hextech-gold">
									Local environment
								</p>
								<h2
									id="dev-payment-modal-title"
									className="text-2xl font-black uppercase leading-none tracking-tight text-white"
								>
									Development checkout
								</h2>
							</div>

							<p className="text-xs font-medium leading-6 text-white/55">
								Mercado Pago checkout was skipped because{' '}
								<code className="rounded-sm bg-white/8 px-1.5 py-0.5 font-mono text-[10px] text-amber-100">
									SKIP_MERCADO_PAGO_CHECKOUT_IN_DEV_MODE=true
								</code>
								. Use this panel to simulate the provider result in your local
								flow.
							</p>

							<div className="rounded-sm border border-white/10 bg-black/20 p-3">
								<p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/35">
									Payment id
								</p>
								<p className="mt-2 break-all font-mono text-[11px] leading-5 text-hextech-cyan">
									{devPaymentId}
								</p>
							</div>
						</div>
					</div>

					<div className="min-w-0 space-y-4 p-5">
						<div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-white/45">
							<ShieldCheck className="h-3.5 w-3.5 text-hextech-cyan" />
							Authenticated request
						</div>

						<CopySnippet
							label="Endpoint"
							value={simulationPath}
							display={`POST ${simulationPath}`}
						/>

						<CopySnippet
							label="Access token"
							value={accessTokenPlaceholder}
							codeClassName="h-12"
						/>

						<CopySnippet
							label="Body"
							value={approvedOutcomeBody}
							codeClassName="text-emerald-100"
						/>

						<div className="rounded-sm border border-white/10 bg-white/[0.03] p-3">
							<p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/35">
								Outcome options
							</p>
							<p className="mt-2 text-xs leading-5 text-white/55">
								Replace{' '}
								<code className="rounded-sm bg-black/25 px-1.5 py-0.5 font-mono text-[10px] text-emerald-100">
									approved
								</code>{' '}
								in the body with any supported provider-like state:
							</p>
							<div className="mt-3 flex flex-wrap gap-2">
								{acceptedOutcomes.map((outcome) => (
									<span
										key={outcome}
										className="rounded-sm border border-white/10 bg-black/20 px-2 py-1 font-mono text-[10px] text-white/55"
									>
										{outcome}
									</span>
								))}
							</div>
						</div>

						<div className="rounded-sm border border-hextech-cyan/15 bg-hextech-cyan/[0.04] p-4">
							<div className="flex items-center gap-2">
								<KeyRound className="h-3.5 w-3.5 text-hextech-cyan" />
								<p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/65">
									How to get the token
								</p>
							</div>
							<div className="mt-3 space-y-3 text-xs leading-6 text-white/55">
								<p>
									In your API client, for example Bruno or Insomnia, set
									Authorization to Bearer Token and paste the copied access
									token. If the token above still shows{' '}
									<code className="rounded-sm bg-black/25 px-1.5 py-0.5 font-mono text-[10px] text-amber-100">
										&lt;accessToken&gt;
									</code>
									, log in from that API client as the dev client and copy the{' '}
									<code className="rounded-sm bg-black/25 px-1.5 py-0.5 font-mono text-[10px] text-amber-100">
										accessToken
									</code>{' '}
									from the response.
								</p>
								<CopySnippet
									label="Login"
									value="/auth/login"
									display="POST /auth/login"
								/>
								<CopySnippet
									label="Login body"
									value={loginBody}
									maskedDisplay={maskedLoginBody}
									codeClassName="text-white/75"
								/>
							</div>
						</div>

						<Link
							href="/client"
							className={getButtonClassName({
								variant: 'outline',
								size: 'sm',
								className: 'w-full gap-2',
							})}
						>
							<X className="h-3.5 w-3.5" />
							Close dev panel
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
};
