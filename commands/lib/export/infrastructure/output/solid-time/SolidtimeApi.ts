import { type } from 'arktype';

import TimeRange from '../../../domain/common/ports/TimeRange.js';
import { Result } from '../../../domain/utils/type-utils.js';
import DateString from '../../common/arktype/DateString.js';
import HttpFetcher from '../http/HttpFetcher.js';
import { SolidTimeProject, SolidTimeProjectType } from './SolidTimeProject.js';

export default class SolidtimeApi {
    private fetcher: HttpFetcher;

    private constructor(
        public readonly solidtimeUrl: string,
        public readonly solidtimeApiKey: string,
        public readonly organizationId: string,
    ) {
        this.fetcher = HttpFetcher.create({
            baseURL: `${solidtimeUrl}/api/v1/organizations/${organizationId}`,
            headers: {
                Authorization: `Bearer ${solidtimeApiKey}`,
                'Content-Type': 'application/json',
            },
            defaultTimeout: 5000,
        });
    }

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
        return this.fetcher.get(
            '/projects',
            type({
                data: SolidTimeProjectType.array(),
                meta: type({
                    total: 'number',
                }),
            }),
        );
    }

    public async getTimeEntries({
        timeRange,
        project,
    }: {
        timeRange?: TimeRange;
        project?: SolidTimeProject;
    } = {}) {
        return this.fetcher.get(
            '/time-entries',
            type({
                data: type({
                    id: 'string',
                    start: DateString,
                    end: DateString.or('null'),
                    description: 'string|null',
                    project_id: 'string|null',
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
                },
            },
        );
    }
}
