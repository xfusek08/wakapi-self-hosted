import Project from '../../common/ports/Project';
import { Result } from '../../utils/type-utils';
import TimeRecord from '../../common/ports/TimeRecord';

export interface InputRepositoryQuery<P extends Project = Project> {
    getProjects(range: { from: Date; to: Date }): Promise<Result<P[]>>;

    getRecordsForProject(
        project: P,
        range: { from: Date; to: Date },
    ): Promise<Result<TimeRecord[]>>;
}
