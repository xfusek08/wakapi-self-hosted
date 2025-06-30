import TimeRange from '../utility-classes/TimeRange';
import { Result } from '../utility-types/Result';
import Project from './Project';
import TimeEntry from './TimeEntry';

export default interface RepositoryQuery<P extends Project = Project> {
    getTimeEntries(timeRange: TimeRange): Promise<Result<TimeEntry<P>[]>>;
}
