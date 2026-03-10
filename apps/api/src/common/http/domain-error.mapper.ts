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
	return (
		tryMapDomainErrorToHttpException(error, rules) ??
		new BadRequestException(fallbackMessage)
	);
}

export function tryMapDomainErrorToHttpException(
	error: unknown,
	rules: DomainErrorMappingRule[],
): HttpException | null {
	for (const rule of rules) {
		if (rule.errorTypes.some((errorType) => error instanceof errorType)) {
			const message =
				error instanceof Error ? error.message : 'Unexpected error.';
			return rule.toException(message);
		}
	}

	return null;
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
