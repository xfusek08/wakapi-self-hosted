import InputRecord from '../../../domain/input/ports/InputRecord';
import WakapiProject from './WakapiProject';

export default class WakapiRecord implements InputRecord<WakapiProject> {
    private constructor(
        public readonly from: Date,
        public readonly to: Date,
        public readonly project: WakapiProject,
    ) {}

    static create({
        from,
        to,
        project,
    }: {
        from: Date;
        to: Date;
        project: WakapiProject;
    }): WakapiRecord {
        return new WakapiRecord(from, to, project);
    }
}
