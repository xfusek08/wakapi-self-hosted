export type QueryParamValue =
    | string
    | number
    | Date
    | null
    | undefined
    | Array<QueryParamValue>;

export type QueryParams = Record<string, QueryParamValue>;

export class QueryParamSerializer {
    /**
     * Serializes query parameters to a URL query string
     * @param params The query parameters to serialize
     * @returns The serialized query string without the leading '?'
     */
    public serialize(params: QueryParams): string {
        const searchParams = new URLSearchParams();

        // Process each parameter
        Object.entries(params).forEach(([key, value]) => {
            this.processValue(searchParams, key, value);
        });

        return searchParams.toString();
    }

    /**
     * Process a value and add it to the URLSearchParams object
     */
    private processValue(
        searchParams: URLSearchParams,
        key: string,
        value: QueryParamValue,
    ): void {
        // Skip null or undefined values
        if (value === null || value === undefined) {
            return;
        }

        // Handle arrays
        if (Array.isArray(value)) {
            // Skip empty arrays
            if (value.length === 0) {
                return;
            }

            // Process each array item
            value.forEach((item) => {
                if (item !== null && item !== undefined) {
                    this.processValue(searchParams, `${key}[]`, item);
                }
            });
            return;
        }

        // Handle dates
        if (value instanceof Date) {
            // Format date as YYYY-MM-DDTHH:mm:ssZ (without milliseconds)
            const isoString = value.toISOString().replace(/\.\d{3}Z$/, 'Z');
            searchParams.append(key, isoString);
            return;
        }

        // Handle numbers and strings
        searchParams.append(key, String(value));
    }
}
