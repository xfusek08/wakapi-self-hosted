import Project from '../../../domain/common/ports/Project';
import RepositoryMutator from '../../../domain/common/ports/RepositoryMutator';
import TimeEntry from '../../../domain/common/ports/TimeEntry';
import { Result } from '../../../domain/common/utility-types/Result';
import SolidtimeApi from './SolidtimeApi';
import SolidTimeEntry from './SolidTimeEntry';
import SolidTimeProject from './SolidTimeProject';

export default class SolidtimeRepositoryMutator
    implements RepositoryMutator<SolidTimeProject, SolidTimeEntry>
{
    private constructor(private readonly _api: SolidtimeApi) {}

    static create(api: SolidtimeApi): Result<SolidtimeRepositoryMutator> {
        return Result.ok(new SolidtimeRepositoryMutator(api));
    }

    public async pushProject(name: Project): Promise<void> {
        throw new Error('Method not implemented.');
    }

    public async pushEntry(record: TimeEntry): Promise<void> {
        throw new Error('Method not implemented.');
    }
}
