import Project from './Project';
import TimeEntry from './TimeEntry';

export default interface RepositoryMutator<
    P extends Project = Project,
    T extends TimeEntry = TimeEntry,
> {
    pushProject(name: P): Promise<void>;
    pushEntry(record: T): Promise<void>;
}
