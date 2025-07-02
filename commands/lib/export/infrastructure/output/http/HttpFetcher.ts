import { ArkErrors, type } from 'arktype';

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
    ): Promise<T['infer']> {
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
    ): Promise<T['infer']> {
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
    ): Promise<T['infer']> {
        const {
            method = 'GET',
            data = null,
            timeout = this.defaultTimeout,
            headers = {},
            queryParams = {},
        } = options;

        const url = this.buildURL(endpoint, queryParams);

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
            requestOptions.body = this.serializeData(data);
        }

        // Start request logging
        console.log(`Fetching ${method} ${endpoint} with query params:`, {
            queryParams,
            data,
            body: data ? this.serializeData(data) : undefined,
            url,
        });

        // Log curl command for debugging
        // this.logCurlCommand(url, method, requestOptions, data);

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
            throw error;
        } finally {
            clearTimeout(timeoutId);
        }

        stopWatch.stop();
        process.stdout.write(`done in ${stopWatch.getElapsedTime()}ms\n`);

        if (!response.ok) {
            const responseParsed = await response.json();
            console.log(
                '\n\n',
                '❌ Request failed:',
                '\nResponse:\n',
                responseParsed,
                '\n\n',
            );
            throw new Error(
                `HTTP error ${response.status}: ${response.statusText}`,
            );
        }

        const responseParsed = await response.json();
        // console.log(`Response from ${method} ${endpoint}:`, responseParsed);
        const validatedData = validator(responseParsed);
        if (validatedData instanceof ArkErrors) {
            console.log(
                '\n\n',
                '❌ Response is in invalid format:',
                '\nResponse:\n',
                responseParsed,
                '\nErrors:\n',
                validatedData.summary,
                '\n\n',
            );
            throw new Error('Data Validation after fetch has failed');
        }

        return validatedData;
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

    private serializeData<T extends Record<string, unknown>>(data: T): string {
        const replaceDatesRecursively = (obj: unknown): unknown => {
            if (obj instanceof Date) {
                return obj.toISOString().replace(/\.\d{3}Z$/, 'Z');
            } else if (Array.isArray(obj)) {
                return obj.map(replaceDatesRecursively);
            } else if (obj && typeof obj === 'object') {
                const newObj: Record<string, unknown> = {};
                for (const [key, value] of Object.entries(obj)) {
                    newObj[key] = replaceDatesRecursively(value);
                }
                return newObj;
            }
            return obj;
        };
        const processedData = replaceDatesRecursively(data);
        return JSON.stringify(processedData);
    }
}
