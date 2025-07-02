import { type } from 'arktype';
import Cache from 'bunner/framework/utils/Cache.js';

import TimeRange from '../../../domain/common/utility-classes/TimeRange.js';
import { Result } from '../../../domain/common/utility-types/Result.js';
import DateString from '../../common/arktype/DateString.js';
import HttpFetcher from '../http/HttpFetcher.js';

export const SolidTimeApiProjectType = type({
    id: 'string',
    name: 'string',
    color: 'string',
    client_id: 'string|null',
    is_archived: 'boolean',
});

export type SolidTimeApiProject = typeof SolidTimeApiProjectType.infer;

export const SolidTimeApiEntryType = type({
    id: 'string',
    start: DateString,
    end: DateString.or('null'),
    description: 'string',
    project_id: 'string|null',
});

export type SolidTimeApiEntry = typeof SolidTimeApiEntryType.infer;

export default class SolidtimeApi {
    private constructor(
        public readonly solidtimeUrl: string,

        public readonly solidtimeApiKey: string,

        public readonly organizationId: string,

        public readonly memberId: string,

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
        memberId,
    }: {
        solidtimeUrl?: string;
        solidtimeApiKey?: string;
        organizationId?: string;
        memberId?: string;
    }): Result<SolidtimeApi> {
        if (solidtimeUrl && solidtimeApiKey && organizationId && memberId) {
            return Result.ok(
                new SolidtimeApi(
                    solidtimeUrl,
                    solidtimeApiKey,
                    organizationId,
                    memberId,
                ),
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

        if (!memberId) {
            errors.push('Solidtime member ID is required');
        }

        return Result.error(errors);
    }

    public getProjects() {
        return this.cache.cached('getProjects', () =>
            this.fetcher.get(
                '/projects',
                type({
                    data: SolidTimeApiProjectType.array(),
                    meta: type({
                        total: 'number',
                    }),
                }),
            ),
        );
    }

    public getTimeEntries({
        timeRange,
        projectId,
        tagIds,
    }: {
        timeRange?: TimeRange;
        projectId?: string;
        tagIds?: string[];
    } = {}) {
        return this.cache.cached(
            `getTimeEntries-${timeRange?.asFormattedString()}-${projectId}`,
            () =>
                this.fetcher.get(
                    '/time-entries',
                    type({
                        data: SolidTimeApiEntryType.array(),
                        meta: type({
                            total: 'number',
                        }),
                    }),
                    {
                        queryParams: {
                            start: timeRange?.from,
                            end: timeRange?.to,
                            project_ids: [projectId],
                            tag_ids: tagIds,
                        },
                    },
                ),
        );
    }

    public createProject({ name }: { name: string }) {
        const randomHex = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
        return this.fetcher.post(
            '/projects',
            type({ data: SolidTimeApiProjectType }),
            {
                name,
                color: randomHex,
                is_billable: false,
                client_id: null,
                member_id: this.memberId,
            },
        );
    }

    public createTimeEntry({
        start,
        end,
        description = '',
        projectId = null,
    }: {
        start: Date;
        end: Date;
        description?: string;
        projectId?: string | null;
    }) {
        return this.fetcher.post(
            '/time-entries',
            type({ data: SolidTimeApiEntryType }),
            {
                member_id: this.memberId,
                start,
                end,
                description,
                billable: false,
                project_id: projectId,
            },
        );
    }
}
