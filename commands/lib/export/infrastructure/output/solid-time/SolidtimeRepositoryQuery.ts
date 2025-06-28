import { RepositoryQuery } from '../../../domain/common/ports/RepositoryQuery';
import TimeRange from '../../../domain/common/ports/TimeRange';
import TimeRecord from '../../../domain/common/ports/TimeRecord';
import { Result } from '../../../domain/utils/type-utils';
import SolidtimeApiConnectionConfiguration from './SolidtimeApiConnectionConfiguration';
import SolidTimeProject from './SolidTimeProject';

export default class SolidtimeRepositoryQuery
    implements RepositoryQuery<SolidTimeProject>
{
    private constructor(
        private readonly _configuration: SolidtimeApiConnectionConfiguration,
    ) {}

    static create(
        configuration: SolidtimeApiConnectionConfiguration,
    ): Result<SolidtimeRepositoryQuery> {
        return Result.ok(new SolidtimeRepositoryQuery(configuration));
    }

    getProjects(timeRange: TimeRange): Promise<Result<SolidTimeProject[]>> {
        throw new Error(
            'Method not implemented. Use getProjectsForTimeRange instead.',
        );
    }

    getRecordsForProject({
        project,
        timeRange,
    }: {
        project: SolidTimeProject;
        timeRange: TimeRange;
    }): Promise<Result<TimeRecord[]>> {
        throw new Error(
            'Method not implemented. Use getRecordsForProjectForTimeRange instead.',
        );
    }
}
