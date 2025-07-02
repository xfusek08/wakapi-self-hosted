import TimeEntry from './TimeEntry';

export default interface RepositoryMutator<T extends TimeEntry> {
    pushEntry(record: TimeEntry): Promise<T>;
}
