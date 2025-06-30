import { ArkErrors, type } from 'arktype';

import { Result } from '../../../domain/common/utility-types/Result';
import { QueryParams, QueryParamSerializer } from './QueryParamSerializer';

export type HttpHeaders = Record<string, string>;

export interface FetcherOptions {
    baseURL: string;
    headers?: HttpHeaders;
    defaultTimeout?: number;
}

export default class HttpFetcher {
    private readonly queryParamSerializer: QueryParamSerializer;

    private constructor(
        private readonly baseURL: string,
        private readonly defaultHeaders: HttpHeaders = {},
        private readonly defaultTimeout: number = 5000,
    ) {
        this.queryParamSerializer = new QueryParamSerializer();
    }

    static create(options: FetcherOptions): HttpFetcher {
        return new HttpFetcher(
            options.baseURL,
            options.headers || {},
            options.defaultTimeout || 5000,
        );
    }

    public async get<T extends type.Any>(
        endpoint: string,
        validator: T,
        options: {
            timeout?: number;
            headers?: HttpHeaders;
            queryParams?: QueryParams;
        } = {},
    ): Promise<Result<T['infer']>> {
        return this.fetch(endpoint, validator, { ...options, method: 'GET' });
    }

    public async post<
        T extends type.Any,
        TData extends Record<string, unknown> = Record<string, unknown>,
    >(
        endpoint: string,
        validator: T,
        data: TData,
        options: {
            timeout?: number;
            headers?: HttpHeaders;
            queryParams?: QueryParams;
        } = {},
    ): Promise<Result<T['infer']>> {
        return this.fetch(endpoint, validator, {
            ...options,
            data,
            method: 'POST',
        });
    }

    private async fetch<
        T extends type.Any,
        TData extends Record<string, unknown> = Record<string, unknown>,
    >(
        endpoint: string,
        validator: T,
        options: {
            method?: string;
            data?: TData;
            timeout?: number;
            headers?: HttpHeaders;
            queryParams?: QueryParams;
        } = {},
    ): Promise<Result<T['infer']>> {
        const {
            method = 'GET',
            data = null,
            timeout = this.defaultTimeout,
            headers = {},
            queryParams = {},
        } = options;

        const url = this.buildURL(endpoint, queryParams);

        // console.log(`Fetching ${method} ${endpoint} with query params:`, {
        //     queryParams,
        //     data,
        //     url,
        // });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        const stopWatch = {
            startTime: null as number | null,
            endTime: null as number | null,
            start() {
                this.endTime = 0;
                this.startTime = Date.now();
            },
            stop() {
                this.endTime = Date.now();
            },
            getElapsedTime() {
                if (this.startTime === null) {
                    return 0;
                }
                return (this.endTime ?? Date.now()) - this.startTime;
            },
        };

        const requestOptions: RequestInit = {
            method,
            headers: {
                ...this.defaultHeaders,
                ...headers,
            },
            signal: controller.signal,
        };

        if (data) {
            requestOptions.body = JSON.stringify(data);
        }

        // Log curl command for debugging
        // this.logCurlCommand(url, method, requestOptions, data);

        // Start request logging
        process.stdout.write(`Fetching ${method} ${endpoint}... `);
        stopWatch.start();

        let response: Response;
        try {
            response = await fetch(url, requestOptions);
        } catch (error) {
            stopWatch.stop();
            process.stdout.write(
                `Error after ${stopWatch.getElapsedTime()}ms\n\n`,
            );
            console.trace(error);
            return Result.error('Failed to fetch');
        } finally {
            clearTimeout(timeoutId);
        }

        stopWatch.stop();
        process.stdout.write(`done in ${stopWatch.getElapsedTime()}ms\n`);

        if (!response.ok) {
            console.log('\n');
            return Result.error(
                `HTTP error ${response.status}: ${response.statusText}`,
            );
        }

        const responseParsed = await response.json();
        // console.log(`Response from ${method} ${endpoint}:`, responseParsed);
        const validatedData = validator(responseParsed);
        if (validatedData instanceof ArkErrors) {
            console.log(
                '\n\n',
                '❌ Failed to validate response data:',
                '\nResponse:\n',
                responseParsed,
                '\nErrors:\n',
                validatedData.summary,
                '\n\n',
            );
            return Result.error('Data Validation after fetch has failed');
        }

        return Result.ok(validatedData);
    }

    private buildURL(endpoint: string, queryParams: QueryParams = {}): string {
        const url = `${this.baseURL}${endpoint}`;
        const queryString = this.queryParamSerializer.serialize(queryParams);
        if (queryString.length > 0) {
            return `${url}?${queryString}`;
        }
        return url;
    }

    private logCurlCommand(
        url: string,
        method: string,
        requestOptions: RequestInit,
        data: Record<string, unknown> | null,
    ): void {
        let curlCommand = `curl -X ${method} '${url}'`;

        // Add headers to curl command
        for (const [key, value] of Object.entries({
            ...(requestOptions.headers as Record<string, string>),
        })) {
            curlCommand += ` -H "${key}: ${value}"`;
        }

        // Add body to curl command if present
        if (data) {
            curlCommand += ` -d '${JSON.stringify(data)}'`;
        }

        console.log('\ncurl command:\n\n', curlCommand);
        console.log('\n\n');
    }
}
