import { z } from 'zod';

export const ratingSchema = z.object({
	id: z.string(),
	orderId: z.string(),
	fromUserId: z.string(),
	toUserId: z.string(),
	score: z.number().int().min(1).max(5),
	comment: z.string().nullable(),
	createdAt: z.string(),
});

export type RatingOutput = z.infer<typeof ratingSchema>;

export const ratingsSchema = z.array(ratingSchema);

export const submitRatingInputSchema = z.object({
	orderId: z.string().min(1),
	score: z.coerce.number().int().min(1).max(5),
	comment: z.string().trim().min(1).max(2000).optional(),
});

export type SubmitRatingInput = z.infer<typeof submitRatingInputSchema>;
