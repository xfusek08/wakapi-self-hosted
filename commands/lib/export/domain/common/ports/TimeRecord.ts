import Project from './Project';
import TimeRange from './TimeRange';

export default interface TimeRecord {
    readonly timeRange: TimeRange;
    readonly project: Project;
}
