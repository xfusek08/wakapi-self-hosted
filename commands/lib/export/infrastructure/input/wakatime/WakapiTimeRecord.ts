import { ArkErrors, type } from 'arktype';

import TimeEntry from '../../../domain/common/ports/TimeEntry.js';
import TimeRangePartial from '../../../domain/common/utility-classes/TimeRangePartial.js';
import { Result } from '../../../domain/common/utility-types/Result.js';
import DateString from '../../common/arktype/DateString.js';
import WakapiProject from './WakapiProject.js';

export default class WakapiTimeEntry implements TimeEntry<WakapiProject> {
    private constructor(
        public readonly timeRange: TimeRangePartial,
        public readonly project: WakapiProject,
    ) {}

    static create({
        timeRange,
        project,
    }: {
        timeRange: TimeRangePartial;
        project: WakapiProject;
    }): WakapiTimeEntry {
        return new WakapiTimeEntry(timeRange, project);
    }

    static parse(data: unknown): Result<WakapiTimeEntry> {
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
            WakapiTimeEntry.create({
                timeRange: TimeRangePartial.create({
                    from: parsed.start_time,
                    to: parsed.end_time,
                }),
                project: parsed.project,
            }),
        );
    }
}
