import { Result } from '../../../utils/type-utils';
import Project from '../../common/ports/Project';
import TimeRecord from '../../common/ports/TimeRecord';

export interface OutputRepositoryMutator {
    pushProject(name: string): Promise<Result<Project>>;
    deleteProject(project: Project): Promise<Result<void>>;
    pushRecord(record: TimeRecord): Promise<Result<void>>;
    deleteRecord(record: TimeRecord): Promise<Result<void>>;
}
