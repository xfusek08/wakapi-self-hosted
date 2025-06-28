import Project from '../../../domain/common/ports/Project';
import TimeRecord from '../../../domain/common/ports/TimeRecord';
import { OutputRepositoryMutator } from '../../../domain/output/ports/OutputRepositoryMutator';
import { Result } from '../../../domain/utils/type-utils';

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

    async pushRecord(record: TimeRecord): Promise<Result<void>> {
        throw new Error('Not implemented - createRecord mock');
    }

    async deleteRecord(record: TimeRecord): Promise<Result<void>> {
        throw new Error('Not implemented - deleteRecord mock');
    }
}
