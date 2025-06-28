export class UnexpectedError extends Error {
    private constructor(public readonly data: unknown) {
        super('Unknown Error');
    }

    public static create(data: unknown) {
        return new UnexpectedError(data);
    }
}

type ErrorTypes = string | string[] | Error[] | Error | UnexpectedError;

export class Errors {
    private constructor(private readonly error: ErrorTypes) {}

    public static create(error: ErrorTypes): Errors {
        return new Errors(error);
    }

    public static fromUnknown(value: unknown): Errors {
        if (value instanceof Errors) {
            return value;
        }

        if (Errors.isErrorType(value)) {
            return Errors.create(value);
        }

        return Errors.create(UnexpectedError.create(value));
    }

    public static isErrorType(value: unknown): value is ErrorTypes {
        if (value instanceof Error) {
            return true;
        }

        if (value instanceof UnexpectedError) {
            return true;
        }

        if (typeof value === 'string') {
            return true;
        }

        if (Array.isArray(value)) {
            if (value.every((e) => typeof e === 'string')) {
                return true;
            }

            if (value.every((e) => e instanceof Error)) {
                return true;
            }
        }

        return false;
    }

    public throw(): never {
        throw new Error(this.toString());
    }

    public toString(): string {
        if (Array.isArray(this.error)) {
            return this.error
                .map((e) => (e instanceof Error ? e.message : String(e)))
                .join('; ');
        } else if (this.error instanceof Error) {
            return this.error.message;
        }
        return this.error;
    }
}
