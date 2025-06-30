import TimeEntry from '../../../domain/common/ports/TimeEntry';
import SolidTimeProject from './SolidTimeProject';

export default interface SolidTimeEntry extends TimeEntry<SolidTimeProject> {
    readonly id: string;
    readonly description: string | null;
}
