import { BadRequestException } from '@nestjs/common';
import { createOrderSchema } from '@shared/orders/create-order.schema';
import { ZodValidationPipe } from './zod-validation.pipe';

describe('ZodValidationPipe', () => {
	it('returns parsed values for a valid payload', () => {
		const pipe = new ZodValidationPipe(createOrderSchema);

		expect(pipe.transform({ quoteId: 'quote-1' })).toEqual({
			quoteId: 'quote-1',
		});
	});

	it('maps invalid payloads to bad request errors', () => {
		const pipe = new ZodValidationPipe(createOrderSchema);

		expect(() => pipe.transform({ boosterId: 'booster-1' })).toThrow(
			BadRequestException,
		);
	});
});
