import TimeRecord from '../../../domain/common/ports/TimeRecord';
import WakapiProject from './WakapiProject';

export default class WakapiRecord implements TimeRecord {
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
