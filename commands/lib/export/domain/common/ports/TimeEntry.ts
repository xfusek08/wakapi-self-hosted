import TimeRangePartial from '../utility-classes/TimeRangePartial';
import Project from './Project';

export default interface TimeEntry<P extends Project = Project> {
    readonly timeRange: TimeRangePartial;
    readonly project: P | null;
}
