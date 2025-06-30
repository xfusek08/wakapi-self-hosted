import { type } from 'arktype';
import Cache from 'bunner/framework/utils/Cache.js';

import TimeRange from '../../../domain/common/utility-classes/TimeRange.js';
import { Result } from '../../../domain/common/utility-types/Result.js';
import DateString from '../../common/arktype/DateString.js';
import HttpFetcher from '../http/HttpFetcher.js';
import SolidTimeProject from './SolidTimeProject.js';

export default class SolidtimeApi {
    private constructor(
        public readonly solidtimeUrl: string,

        public readonly solidtimeApiKey: string,

        public readonly organizationId: string,

        private readonly fetcher = HttpFetcher.create({
            baseURL: `${solidtimeUrl}/api/v1/organizations/${organizationId}`,
            headers: {
                Authorization: `Bearer ${solidtimeApiKey}`,
                'Content-Type': 'application/json',
            },
            defaultTimeout: 5000,
        }),

        private readonly cache = Cache.create(),
    ) {}

    static create({
        solidtimeUrl,
        solidtimeApiKey,
        organizationId,
    }: {
        solidtimeUrl?: string;
        solidtimeApiKey?: string;
        organizationId?: string;
    }): Result<SolidtimeApi> {
        if (solidtimeUrl && solidtimeApiKey && organizationId) {
            return Result.ok(
                new SolidtimeApi(solidtimeUrl, solidtimeApiKey, organizationId),
            );
        }

        const errors = [];
        if (!solidtimeUrl) {
            errors.push('Solidtime URL is required');
        }

        if (!solidtimeApiKey) {
            errors.push('Solidtime API key is required');
        }

        if (!organizationId) {
            errors.push('Solidtime organization ID is required');
        }

        return Result.error(errors);
    }

    public async getProjects() {
        return this.cache.cached('getProjects', () =>
            this.fetcher.get(
                '/projects',
                type({
                    data: type({
                        id: 'string',
                        name: 'string',
                        color: 'string',
                        client_id: 'string|null',
                        is_archived: 'boolean',
                    }).array(),
                    meta: type({
                        total: 'number',
                    }),
                }),
            ),
        );
    }

    public async getTimeEntries({
        timeRange,
        project,
        tagIds,
    }: {
        timeRange?: TimeRange;
        project?: SolidTimeProject;
        tagIds?: string[];
    } = {}) {
        return this.cache.cached(
            `getTimeEntries-${timeRange?.asFormattedDateRangeString()}-${project?.id}`,
            () =>
                this.fetcher.get(
                    '/time-entries',
                    type({
                        data: type({
                            id: 'string',
                            start: DateString,
                            end: DateString.or('null'),
                            description: 'string|null',
                            project_id: 'string|null',
                            tags: 'string[]',
                        }).array(),
                        meta: type({
                            total: 'number',
                        }),
                    }),
                    {
                        queryParams: {
                            start: timeRange?.from,
                            end: timeRange?.to,
                            project_ids: [project?.id],
                            tag_ids: tagIds,
                        },
                    },
                ),
        );
    }
}
