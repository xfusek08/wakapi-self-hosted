import { Result } from '../../utils/type-utils';
import Project from './Project';
import TimeRange from './TimeRange';
import TimeRecord from './TimeRecord';

export interface RepositoryQuery<P extends Project = Project> {
    getProjects(): Promise<Result<P[]>>;

    getRecordsForProject({
        project,
        timeRange,
    }: {
        project: P;
        timeRange: TimeRange;
    }): Promise<Result<TimeRecord[]>>;
}
