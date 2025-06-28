import Project from '../../../domain/common/ports/Project';
import TimeRecord from '../../../domain/common/ports/TimeRecord';
import { OutputRepositoryMutator } from '../../../domain/output/ports/OutputRepositoryMutator';
import { Result } from '../../../domain/utils/type-utils';
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

    async pushRecord(record: TimeRecord): Promise<Result<void>> {
        throw new Error('Not implemented - createRecord');
    }

    async deleteRecord(record: TimeRecord): Promise<Result<void>> {
        throw new Error('Not implemented - deleteRecord');
    }
}
