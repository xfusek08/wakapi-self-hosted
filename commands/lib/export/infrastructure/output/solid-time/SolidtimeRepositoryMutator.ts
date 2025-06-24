import Project from '../../../domain/common/ports/Project';
import TimeRecord from '../../../domain/common/ports/TimeRecord';
import { OutputRepositoryMutator } from '../../../domain/output/ports/OutputRepositoryMutator';
import { Result } from '../../../utils/type-utils';
import SolidtimeApiConnectionConfiguration from './SolidtimeApiConnectionConfiguration';

export default class SolidtimeRepositoryMutator
    implements OutputRepositoryMutator
{
    private constructor(
        private readonly _configuration: SolidtimeApiConnectionConfiguration,
    ) {}

    static create({
        configuration,
    }: {
        configuration: SolidtimeApiConnectionConfiguration;
    }): Result<SolidtimeRepositoryMutator> {
        return Result.ok(new SolidtimeRepositoryMutator(configuration));
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
