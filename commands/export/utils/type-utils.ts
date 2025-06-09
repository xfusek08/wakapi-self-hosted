type ErrorTypes = string | string[] | Error[] | Error;

export class Errors {
    private constructor(private readonly error: ErrorTypes) {}

    static create(error: ErrorTypes): Errors {
        return new Errors(error);
    }

    public throw(): never {
        throw new Error(this.toString());
    }

    public toString(): string {
        if (Array.isArray(this.error)) {
            return this.error.map(e => e instanceof Error ? e.message : String(e)).join('; ');
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
    
    public unwrap(): T {
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
    
    public unwrap(): never {
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

    export function error(error: ErrorTypes): ResultError {
        return new ResultError(Errors.create(error));
    }
}

export type MatchOptions<T, U, V, E extends Errors = Errors> = {
    ok: (value: T) => U;
    err: (error: E) => V;
};

export function match<T, U, V, E extends Errors = Errors>(value: ResultOk<T>, options: MatchOptions<T, U, V, E>): U;
export function match<T, U, V, E extends Errors = Errors>(value: ResultError<E>, options: MatchOptions<T, U, V, E>): V;
export function match<T, U, V, E extends Errors = Errors>(value: Result<T, E>, options: MatchOptions<T, U, V, E>) : U | V;
export function match<T, U, V, E extends Errors = Errors>(value: Result<T, E>, {ok, err}: MatchOptions<T, U, V, E>) {
    return value.isOk()
        ? ok(value.value)
        : err(value.errors);
}
