import Project from '../common/ports/Project';
import TimeRecord from '../common/ports/TimeRecord';

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

export class ResultOk<T> {
    public constructor(private readonly _value: T) {}

    public isOk(): this is ResultOk<T> {
        return true;
    }

    public isError(): this is ResultError {
        return false;
    }

    public assert(): T {
        return this._value;
    }

    public get value(): T {
        return this._value;
    }
}

export class ResultError<E extends Errors = Errors> {
    public constructor(private readonly error: E) {}

    public isOk(): this is ResultOk<unknown> {
        return false;
    }

    public isError(): this is ResultError {
        return true;
    }

    public assert(): never {
        this.error.throw();
    }

    public get errors(): E {
        return this.error;
    }
}

export type Result<T, E extends Errors = Errors> = ResultOk<T> | ResultError<E>;
export namespace Result {
    export function ok<T>(value: T): ResultOk<T> {
        return new ResultOk(value);
    }

    export function error(error: unknown): ResultError {
        if (error instanceof ResultError) {
            return error;
        }
        return new ResultError(Errors.fromUnknown(error));
    }

    export function isResult<T>(val: T | Result<T>): val is Result<T> {
        return val instanceof ResultOk || val instanceof ResultError;
    }

    export async function asyncAssert<T>(
        val: Promise<Result<T>> | (() => Promise<Result<T>>),
    ): Promise<T> {
        if (typeof val === 'function') {
            return (await val()).assert();
        }
        return (await val).assert();
    }

    export type MatchOptions<T, U, V, E extends Errors = Errors> = {
        ok: (value: T) => U;
        err: (error: E) => V;
    };

    export function match<T, U, V, E extends Errors = Errors>(
        value: ResultOk<T>,
        options: MatchOptions<T, U, V, E>,
    ): U;
    export function match<T, U, V, E extends Errors = Errors>(
        value: ResultError<E>,
        options: MatchOptions<T, U, V, E>,
    ): V;
    export function match<T, U, V, E extends Errors = Errors>(
        value: Result<T, E>,
        options: MatchOptions<T, U, V, E>,
    ): U | V;
    export function match<T, U, V, E extends Errors = Errors>(
        value: Result<T, E>,
        { ok, err }: MatchOptions<T, U, V, E>,
    ) {
        return value.isOk() ? ok(value.value) : err(value.errors);
    }

    type EnsuredResult<T> =
        T extends Result<infer U>
            ? Result<U>
            : T extends Promise<Result<infer U>>
              ? Promise<Result<U>>
              : T extends Promise<infer U>
                ? Promise<Result<U>>
                : Result<T>;

    // Ensuring that the given value will be wrapped as a result or promised result.
    export function ensure<T>(fn: () => T): EnsuredResult<T>;
    export function ensure<T>(fn: T): EnsuredResult<T>;
    export function ensure<T>(arg: T): Result<T> | Promise<Result<T>> {
        const processAwaited = (res: T | Result<T>) => {
            if (isResult(res)) {
                return res;
            }
            return ok(res);
        };

        try {
            let res;
            if (typeof arg === 'function') {
                res = arg();
            } else {
                res = arg;
            }

            if (res instanceof Promise) {
                return res.then(processAwaited);
            }
            return processAwaited(res);
        } catch (err) {
            return error(err);
        }
    }
}
