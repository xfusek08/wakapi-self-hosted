import InputRecord from './InputRecord';

export default interface InputReport {
    from: Date;
    to: Date;
    records: InputRecord[];
}
