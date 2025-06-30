import TimeRange from '../utility-classes/TimeRange';
import Project from './Project';

export default interface TimeEntry<P extends Project = Project> {
    readonly displayName: string;
    readonly identifier: string;
    readonly timeRange: TimeRange;
    readonly project: P;
}
