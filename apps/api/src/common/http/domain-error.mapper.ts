import {
	BadRequestException,
	type HttpException,
	NotFoundException,
} from '@nestjs/common';

type ErrorConstructor = new (...args: never[]) => Error;

type DomainErrorMappingRule = {
	errorTypes: ErrorConstructor[];
	toException: (message: string) => HttpException;
};

export function mapDomainErrorToHttpException(
	error: unknown,
	rules: DomainErrorMappingRule[],
	fallbackMessage = 'Unexpected error.',
): HttpException {
	for (const rule of rules) {
		if (rule.errorTypes.some((errorType) => error instanceof errorType)) {
			const message = error instanceof Error ? error.message : fallbackMessage;
			return rule.toException(message);
		}
	}

	return new BadRequestException(fallbackMessage);
}

export const mapAsNotFound = (
	...errorTypes: ErrorConstructor[]
): DomainErrorMappingRule => ({
	errorTypes,
	toException: (message: string) => new NotFoundException(message),
});

export const mapAsBadRequest = (
	...errorTypes: ErrorConstructor[]
): DomainErrorMappingRule => ({
	errorTypes,
	toException: (message: string) => new BadRequestException(message),
});
