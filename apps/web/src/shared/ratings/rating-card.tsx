'use client';

import { Star } from 'lucide-react';
import { useActionState, useState } from 'react';
import { getButtonClassName } from '@/shared/ui/components/button';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '@/shared/ui/components/card';
import { cn } from '@/shared/ui/utils/cn';
import {
	type SubmitRatingActionState,
	submitRatingAction,
} from './rating-actions';
import type { RatingOutput } from './rating-contracts';

type RatingCardProps = {
	orderId: string;
	currentUserId: string;
	initialRatings: RatingOutput[];
	className?: string;
};

const Stars = ({ score }: { score: number }) => (
	<div className="flex gap-1.5" role="img" aria-label={`${score} de 5`}>
		{[1, 2, 3, 4, 5].map((value) => (
			<Star
				key={value}
				className={`h-4 w-4 ${value <= score ? 'fill-hextech-gold text-hextech-gold' : 'text-white/20'}`}
			/>
		))}
	</div>
);

export const RatingCard = ({
	orderId,
	currentUserId,
	initialRatings,
	className,
}: RatingCardProps) => {
	const [state, formAction, isPending] = useActionState<
		SubmitRatingActionState,
		FormData
	>(submitRatingAction.bind(null, orderId), {});
	const [score, setScore] = useState(0);

	const submitted =
		state.rating ??
		initialRatings.find((rating) => rating.fromUserId === currentUserId);

	return (
		<Card className={cn('border-hextech-gold/15', className)}>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Star className="h-4 w-4 text-hextech-gold" />
					Avaliação
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-5">
				{submitted ? (
					<div className="space-y-2">
						<p className="text-[10px] uppercase tracking-widest text-white/40">
							Você avaliou este pedido
						</p>
						<Stars score={submitted.score} />
						{submitted.comment ? (
							<p className="text-sm leading-relaxed text-white/70">
								{submitted.comment}
							</p>
						) : null}
					</div>
				) : (
					<form action={formAction} className="space-y-4">
						<input type="hidden" name="score" value={score} />
						<div className="space-y-2">
							<p className="text-xs leading-relaxed text-white/45">
								Como foi sua experiência com este pedido?
							</p>
							<div className="flex gap-1">
								{[1, 2, 3, 4, 5].map((value) => (
									<button
										key={value}
										type="button"
										onClick={() => setScore(value)}
										aria-label={`Nota ${value}`}
										className="flex h-11 w-11 items-center justify-center rounded-sm border border-white/10 bg-white/[0.02] transition-colors hover:border-hextech-gold/40"
									>
										<Star
											className={`h-5 w-5 transition-colors ${value <= score ? 'fill-hextech-gold text-hextech-gold' : 'text-white/20'}`}
										/>
									</button>
								))}
							</div>
						</div>
						<textarea
							name="comment"
							rows={3}
							maxLength={2000}
							placeholder="Comentário opcional"
							className="min-h-24 w-full resize-none rounded-sm border border-white/10 bg-white/[0.03] p-3 text-sm leading-relaxed text-white placeholder:text-white/30 focus:border-hextech-gold focus:outline-none"
						/>
						<button
							type="submit"
							disabled={isPending || score === 0}
							className={getButtonClassName({
								size: 'sm',
								className:
									'w-full font-black uppercase tracking-widest disabled:opacity-40',
							})}
						>
							{isPending ? 'Enviando' : 'Enviar avaliação'}
						</button>
						{state.error ? (
							<p className="text-[10px] font-bold leading-4 text-danger">
								{state.error}
							</p>
						) : null}
					</form>
				)}
			</CardContent>
		</Card>
	);
};
