import Project from '../../common/ports/Project';
import TimeEntry from '../../common/ports/TimeEntry';
import { Result } from '../../common/utility-types/Result';

export interface OutputRepositoryMutator {
    pushProject(name: string): Promise<Result<Project>>;
    deleteProject(project: Project): Promise<Result<void>>;
    pushEntry(record: TimeEntry): Promise<Result<void>>;
    deleteEntry(record: TimeEntry): Promise<Result<void>>;
}
