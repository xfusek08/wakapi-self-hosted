import Project from '../../../domain/common/ports/Project';
import { OutputRepositoryQuery } from '../../../domain/output/ports/OutputRepositoryQuery';
import { Result } from '../../../utils/type-utils';
import SolidtimeApiConnectionConfiguration from './SolidtimeApiConnectionConfiguration';

export default class SolidtimeRepositoryQueryMock
    implements OutputRepositoryQuery
{
    private constructor() {}

    static create(): Result<SolidtimeRepositoryQueryMock> {
        return Result.ok(new SolidtimeRepositoryQueryMock());
    }

    async getProjects(): Promise<Result<Project[]>> {
        throw new Error('Not implemented - getProjects mock');
    }

    async getProjectByName(name: string): Promise<Result<Project | null>> {
        throw new Error('Not implemented - getProjectByName mock');
    }
}
