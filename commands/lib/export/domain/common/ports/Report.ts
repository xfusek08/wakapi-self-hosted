import TimeRange from './TimeRange';
import TimeRecord from './TimeRecord';

export default interface Report {
    readonly timeRange: TimeRange;
    readonly records: TimeRecord[];
}
