import Project from '../../../domain/common/ports/Project';
import RepositoryMutator from '../../../domain/common/ports/RepositoryMutator';
import TimeEntry from '../../../domain/common/ports/TimeEntry';
import { Result } from '../../../domain/common/utility-types/Result';
import SolidTimeEntry from './SolidTimeEntry';

export default class SolidtimeRepositoryMutatorMock
    implements RepositoryMutator<SolidTimeEntry>
{
    private constructor() {}

    static create(): Result<SolidtimeRepositoryMutatorMock> {
        return Result.ok(new SolidtimeRepositoryMutatorMock());
    }

    public async pushProject(name: Project): Promise<void> {
        console.log(`New Project: ${name}`);
    }

    public async pushEntry(record: TimeEntry): Promise<SolidTimeEntry> {
        console.log(
            `New Entry: ${record.timeRange.asFormattedString()} | ${record.timeRange.asFormattedDurationString()} | ${record.project.displayName}`,
        );

        return {
            id: 'mock-id',
            timeRange: record.timeRange,
            description: 'Mock Entry',
            project: {
                id: 'mock-project-id',
                displayName: record.project.displayName,
                identifier: record.project.identifier,
            },
            displayName: record.project.displayName,
            identifier: record.project.identifier,
        };
    }
}
