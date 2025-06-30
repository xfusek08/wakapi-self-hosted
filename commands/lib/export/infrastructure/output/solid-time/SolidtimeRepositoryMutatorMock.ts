import Project from '../../../domain/common/ports/Project';
import RepositoryMutator from '../../../domain/common/ports/RepositoryMutator';
import TimeEntry from '../../../domain/common/ports/TimeEntry';
import { Result } from '../../../domain/common/utility-types/Result';
import SolidTimeEntry from './SolidTimeEntry';
import SolidTimeProject from './SolidTimeProject';

export default class SolidtimeRepositoryMutatorMock
    implements RepositoryMutator<SolidTimeProject, SolidTimeEntry>
{
    private constructor() {}

    static create(): Result<SolidtimeRepositoryMutatorMock> {
        return Result.ok(new SolidtimeRepositoryMutatorMock());
    }

    public async pushProject(name: Project): Promise<void> {
        console.log(`New Project: ${name}`);
    }

    public async pushEntry(record: TimeEntry): Promise<void> {
        console.log(
            `New Entry: ${record.timeRange.asFormattedDateRangeString()} | ${record.timeRange.asFormattedDurationString()} | ${record.project.displayName}`,
        );
    }
}
