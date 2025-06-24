import Project from '../../../domain/common/ports/Project';
import { OutputRepositoryQuery } from '../../../domain/output/ports/OutputRepositoryQuery';
import { Result } from '../../../utils/type-utils';
import SolidtimeApiConnectionConfiguration from './SolidtimeApiConnectionConfiguration';

export default class SolidtimeRepositoryQuery implements OutputRepositoryQuery {
    private constructor(
        private readonly _configuration: SolidtimeApiConnectionConfiguration,
    ) {}

    static create({
        configuration,
    }: {
        configuration: SolidtimeApiConnectionConfiguration;
    }): Result<SolidtimeRepositoryQuery> {
        return Result.ok(new SolidtimeRepositoryQuery(configuration));
    }

    async getProjects(): Promise<Result<Project[]>> {
        throw new Error('Not implemented - getProjects');
    }

    async getProjectByName(name: string): Promise<Result<Project | null>> {
        throw new Error('Not implemented - getProjectByName');
    }
}
