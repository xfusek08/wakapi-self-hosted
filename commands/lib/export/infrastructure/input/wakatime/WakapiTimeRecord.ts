import { ArkErrors, type } from 'arktype';

import TimeRange from '../../../domain/common/ports/TimeRange.js';
import TimeRecord from '../../../domain/common/ports/TimeRecord.js';
import { Result } from '../../../domain/utils/type-utils.js';
import DateString from '../../common/arktype/DateString.js';
import WakapiProject from './WakapiProject.js';

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
            start_time: DateString,
            end_time: DateString,
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
