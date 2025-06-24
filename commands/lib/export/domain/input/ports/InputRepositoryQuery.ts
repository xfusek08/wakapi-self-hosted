import Project from '../../common/ports/Project';
import { Result } from '../../../utils/type-utils';
import TimeRecord from '../../common/ports/TimeRecord';

export interface InputRepositoryQuery {
    getProjects(range: { from: Date; to: Date }): Promise<Result<Project[]>>;

    getRecordsForProject(
        project: Project,
        range: { from: Date; to: Date },
    ): Promise<Result<TimeRecord[]>>;
}
