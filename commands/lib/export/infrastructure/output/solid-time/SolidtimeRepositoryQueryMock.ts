import { RepositoryQuery } from '../../../domain/common/ports/RepositoryQuery';
import TimeRange from '../../../domain/common/ports/TimeRange';
import TimeRecord from '../../../domain/common/ports/TimeRecord';
import { Result } from '../../../domain/utils/type-utils';
import SolidTimeProject from './SolidTimeProject';

export default class SolidtimeRepositoryQueryMock
    implements RepositoryQuery<SolidTimeProject>
{
    private constructor() {}

    static create(): Result<SolidtimeRepositoryQueryMock> {
        return Result.ok(new SolidtimeRepositoryQueryMock());
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
