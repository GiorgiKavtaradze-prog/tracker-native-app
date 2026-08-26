export const DOMAIN_ERROR_CODES = [
  "VALIDATION_FAILED",
  "INVARIANT_VIOLATED",
  "NOT_FOUND",
] as const;

export type DomainErrorCode = (typeof DOMAIN_ERROR_CODES)[number];

export type ErrorContext = Readonly<
  Record<string, string | number | boolean | null>
>;

export class DomainError extends Error {
  constructor(
    readonly code: DomainErrorCode,
    message: string,
    readonly context: ErrorContext = {},
  ) {
    super(message);
    this.name = new.target.name;
  }

  get describe(): string {
    return `${this.code}: ${this.message}`;
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, context: ErrorContext = {}) {
    super("VALIDATION_FAILED", message, context);
  }
}

export class InvariantViolationError extends DomainError {
  constructor(message: string, context: ErrorContext = {}) {
    super("INVARIANT_VIOLATED", message, context);
  }
}

export class NotFoundError extends DomainError {
  constructor(entity: string, identifier: string) {
    super("NOT_FOUND", `${entity} "${identifier}" was not located`, {
      entity,
      identifier,
    });
  }
}
