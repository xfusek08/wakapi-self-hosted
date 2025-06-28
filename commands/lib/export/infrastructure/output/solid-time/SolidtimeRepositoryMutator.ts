import Project from '../../../domain/common/ports/Project';
import TimeEntry from '../../../domain/common/ports/TimeEntry';
import { Result } from '../../../domain/common/utility-types/Result';
import { OutputRepositoryMutator } from '../../../domain/output/ports/OutputRepositoryMutator';
import SolidtimeApi from './SolidtimeApi';

export default class SolidtimeRepositoryMutator
    implements OutputRepositoryMutator
{
    private constructor(private readonly _api: SolidtimeApi) {}

    static create(api: SolidtimeApi): Result<SolidtimeRepositoryMutator> {
        return Result.ok(new SolidtimeRepositoryMutator(api));
    }

    async pushProject(name: string): Promise<Result<Project>> {
        throw new Error('Not implemented - createProject');
    }

    async deleteProject(project: Project): Promise<Result<void>> {
        throw new Error('Not implemented - deleteProject');
    }

    async pushEntry(record: TimeEntry): Promise<Result<void>> {
        throw new Error('Not implemented - createRecord');
    }

    async deleteEntry(record: TimeEntry): Promise<Result<void>> {
        throw new Error('Not implemented - deleteRecord');
    }
}
