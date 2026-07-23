import {
	BadRequestDomainError,
	ConflictDomainError,
	DomainError,
	ForbiddenDomainError,
	NotFoundDomainError,
	UnauthorizedDomainError,
} from '@app/common/errors/domain.error';
import {
	ArgumentsHost,
	BadRequestException,
	Catch,
	ConflictException,
	type ExceptionFilter,
	ForbiddenException,
	type HttpException,
	NotFoundException,
	UnauthorizedException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

type DomainErrorConstructor = abstract new (...args: never[]) => DomainError;

type DomainErrorRule = [
	DomainErrorConstructor,
	(message: string) => HttpException,
];

const RULES: DomainErrorRule[] = [
	[UnauthorizedDomainError, (message) => new UnauthorizedException(message)],
	[ForbiddenDomainError, (message) => new ForbiddenException(message)],
	[NotFoundDomainError, (message) => new NotFoundException(message)],
	[ConflictDomainError, (message) => new ConflictException(message)],
	[BadRequestDomainError, (message) => new BadRequestException(message)],
];

export function mapApiDomainErrorToHttpException(
	error: unknown,
): HttpException | null {
	if (!(error instanceof DomainError)) return null;

	for (const [base, toException] of RULES)
		if (error instanceof base) return toException(error.httpMessage);

	return null;
}

@Catch()
export class ApiDomainErrorFilter
	extends BaseExceptionFilter
	implements ExceptionFilter
{
	override catch(exception: unknown, host: ArgumentsHost): void {
		const mappedException = mapApiDomainErrorToHttpException(exception);
		super.catch(mappedException ?? exception, host);
	}
}
