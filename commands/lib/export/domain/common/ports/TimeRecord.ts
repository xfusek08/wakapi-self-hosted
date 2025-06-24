import Project from './Project';

export default interface TimeRecord {
    from: Date;
    to: Date;
    project: Project;
}
