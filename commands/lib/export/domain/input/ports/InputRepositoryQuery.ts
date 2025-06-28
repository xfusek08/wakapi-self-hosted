import Project from '../../common/ports/Project';
import { Result } from '../../utils/type-utils';
import TimeRecord from '../../common/ports/TimeRecord';
import TimeRange from '../../common/ports/TimeRange';

export interface InputRepositoryQuery<P extends Project = Project> {
    getProjects({ timeRange }: { timeRange: TimeRange }): Promise<Result<P[]>>;

    getRecordsForProject({
        project,
        timeRange,
    }: {
        project: P;
        timeRange: TimeRange;
    }): Promise<Result<TimeRecord[]>>;
}
