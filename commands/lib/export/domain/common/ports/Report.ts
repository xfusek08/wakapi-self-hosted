import TimeRecord from './TimeRecord';

export default interface Report {
    from: Date;
    to: Date;
    records: TimeRecord[];
}
