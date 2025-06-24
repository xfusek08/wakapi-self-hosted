import { ArkErrors, type } from 'arktype';
import TimeRecord from '../../../domain/common/ports/TimeRecord.js';
import { Result } from '../../../domain/utils/type-utils.js';
import WakapiProject from './WakapiProject.js';
import Project from '../../../domain/common/ports/Project.js';
import SqliteDateString from '../../arktype/SqliteDateString.js';

export default class WakapiTimeRecord implements TimeRecord {
    private constructor(
        private readonly _from: Date,
        private readonly _to: Date,
        public readonly _project: WakapiProject,
    ) {}

    static create({
        from,
        to,
        project,
    }: {
        from: Date;
        to: Date;
        project: WakapiProject;
    }): WakapiTimeRecord {
        return new WakapiTimeRecord(from, to, project);
    }

    static parse(data: unknown): Result<WakapiTimeRecord> {
        const parsed = type({
            start_time: SqliteDateString,
            end_time: SqliteDateString,
            project: type.string.pipe((name) => WakapiProject.create(name)),
        })(data);

        if (parsed instanceof ArkErrors) {
            return Result.error(
                `Failed to parse WakapiTimeRecord: ${parsed.summary}`,
            );
        }

        return Result.ok(
            WakapiTimeRecord.create({
                from: parsed.start_time,
                to: parsed.end_time,
                project: parsed.project,
            }),
        );
    }

    public get from(): Date {
        return this._from;
    }

    public get to(): Date {
        return this._to;
    }

    public get project(): Project {
        return this._project;
    }
}
