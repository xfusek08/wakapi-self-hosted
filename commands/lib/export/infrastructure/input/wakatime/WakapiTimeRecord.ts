import { ArkErrors, type } from 'arktype';
import TimeRecord from '../../../domain/common/ports/TimeRecord.js';
import { Result } from '../../../domain/utils/type-utils.js';
import WakapiProject from './WakapiProject.js';
import SqliteDateString from '../../common/arktype/SqliteDateString.js';
import TimeRange from '../../../domain/common/ports/TimeRange.js';

export default class WakapiTimeRecord implements TimeRecord {
    private constructor(
        public readonly timeRange: TimeRange,
        public readonly project: WakapiProject,
    ) {}

    static create({
        timeRange,
        project,
    }: {
        timeRange: TimeRange;
        project: WakapiProject;
    }): WakapiTimeRecord {
        return new WakapiTimeRecord(timeRange, project);
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
                timeRange: TimeRange.create({
                    from: parsed.start_time,
                    to: parsed.end_time,
                }),
                project: parsed.project,
            }),
        );
    }
}
