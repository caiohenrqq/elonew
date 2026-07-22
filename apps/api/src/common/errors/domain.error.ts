// Domain errors carry their own HTTP semantics so the global filter never has
// to import from a module. Pick the base class that matches the failure and the
// status follows; a new error is mapped the moment it is written.
export abstract class DomainError extends Error {
	// Overridden when the response must not leak the internal reason.
	get httpMessage(): string {
		return this.message;
	}
}

export abstract class UnauthorizedDomainError extends DomainError {}
export abstract class ForbiddenDomainError extends DomainError {}
export abstract class NotFoundDomainError extends DomainError {}
export abstract class BadRequestDomainError extends DomainError {}
export abstract class ConflictDomainError extends DomainError {}
