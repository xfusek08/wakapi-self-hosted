import Project from '../../../domain/common/ports/Project';
import TimeEntry from '../../../domain/common/ports/TimeEntry';
import { Result } from '../../../domain/common/utility-types/Result';
import { OutputRepositoryMutator } from '../../../domain/output/ports/OutputRepositoryMutator';

export default class SolidtimeRepositoryMutatorMock
    implements OutputRepositoryMutator
{
    private constructor() {}

    static create(): Result<SolidtimeRepositoryMutatorMock> {
        return Result.ok(new SolidtimeRepositoryMutatorMock());
    }

    async pushProject(name: string): Promise<Result<Project>> {
        throw new Error('Not implemented - createProject mock');
    }

    async deleteProject(project: Project): Promise<Result<void>> {
        throw new Error('Not implemented - deleteProject mock');
    }

    async pushEntry(record: TimeEntry): Promise<Result<void>> {
        throw new Error('Not implemented - createRecord mock');
    }

    async deleteEntry(record: TimeEntry): Promise<Result<void>> {
        throw new Error('Not implemented - deleteRecord mock');
    }
}
