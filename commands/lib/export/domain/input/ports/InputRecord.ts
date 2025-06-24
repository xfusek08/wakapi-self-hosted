import InputProject from './InputProject';

export default interface InputRecord<P extends InputProject = InputProject> {
    from: Date;
    to: Date;
    project: P;
}
