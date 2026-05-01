import { z } from 'zod';
import { orderExtraTypes } from './order-extra';
import { orderServiceTypes } from './service-type';

const MASTER_PDL_MIN = 0;
const MASTER_PDL_MAX = 250;
const MASTER_RANK_DIVISION = 'MASTER';

const isMasterLeague = (league: string) =>
	league.trim().toLowerCase() === 'master';

const isMasterPdlDivision = (division: string) => {
	const pdl = Number(division);
	return (
		Number.isInteger(pdl) && pdl >= MASTER_PDL_MIN && pdl <= MASTER_PDL_MAX
	);
};

const isValidMasterDivision = (division: string) => {
	return division === MASTER_RANK_DIVISION || isMasterPdlDivision(division);
};

export const createOrderQuoteSchema = z
	.object({
		serviceType: z.enum(orderServiceTypes),
		couponCode: z.string().trim().min(1).optional(),
		extras: z
			.array(z.enum(orderExtraTypes))
			.default([])
			.refine((extras) => new Set(extras).size === extras.length, {
				message: 'Duplicate extras are not allowed.',
			}),
		currentLeague: z.string().trim().min(1),
		currentDivision: z.string().trim().min(1),
		currentLp: z.number().int().min(MASTER_PDL_MIN).max(MASTER_PDL_MAX),
		desiredLeague: z.string().trim().min(1),
		desiredDivision: z.string().trim().min(1),
		server: z.string().trim().min(1),
		desiredQueue: z.string().trim().min(1),
		lpGain: z.number().int(),
		deadline: z.string().datetime(),
	})
	.superRefine((input, context) => {
		if (!isMasterLeague(input.currentLeague) && input.currentLp > 99) {
			context.addIssue({
				code: z.ZodIssueCode.too_big,
				type: 'number',
				maximum: 99,
				inclusive: true,
				path: ['currentLp'],
				message: 'Current LP must be between 0 and 99 before Master.',
			});
		}

		if (
			isMasterLeague(input.currentLeague) &&
			!isValidMasterDivision(input.currentDivision)
		) {
			context.addIssue({
				code: z.ZodIssueCode.custom,
				path: ['currentDivision'],
				message: `Master PDL must be between ${MASTER_PDL_MIN} and ${MASTER_PDL_MAX}.`,
			});
		}

		if (
			isMasterLeague(input.desiredLeague) &&
			!isValidMasterDivision(input.desiredDivision)
		) {
			context.addIssue({
				code: z.ZodIssueCode.custom,
				path: ['desiredDivision'],
				message: `Master PDL must be between ${MASTER_PDL_MIN} and ${MASTER_PDL_MAX}.`,
			});
		}
	});

export type CreateOrderQuoteSchemaInput = z.input<
	typeof createOrderQuoteSchema
>;
