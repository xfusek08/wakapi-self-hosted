import { sha256 } from '@noble/hashes/sha2';
import { ArkErrors, type } from 'arktype';
import base32 from 'hi-base32';

import TimeEntry from '../../../domain/common/ports/TimeEntry.js';
import TimeRange from '../../../domain/common/utility-classes/TimeRange.js';
import { Result } from '../../../domain/common/utility-types/Result.js';
import DateString from '../../common/arktype/DateString.js';
import WakapiProject from './WakapiProject.js';

export default class WakapiTimeEntry implements TimeEntry<WakapiProject> {
    private constructor(
        public readonly timeRange: TimeRange,
        public readonly project: WakapiProject,
        public readonly identifier: string,
        public readonly displayName: string,
    ) {}

    static create({
        timeRange,
        project,
    }: {
        timeRange: TimeRange;
        project: WakapiProject;
    }): WakapiTimeEntry {
        return new WakapiTimeEntry(
            timeRange,
            project,
            WakapiTimeEntry.generateIdentifier({ timeRange, project }),
            project.name,
        );
    }

    public static generateIdentifier({
        timeRange,
        project,
    }: {
        timeRange: TimeRange;
        project: WakapiProject;
    }) {
        const input = `${project}${timeRange.asFormattedString()}`;
        const hashBytes = sha256(new TextEncoder().encode(input));

        // Encode hash to base32 and take the first 10 characters
        const base32Str = base32
            .encode(hashBytes)
            .toLowerCase()
            .replace(/=+$/, '');

        return base32Str.slice(0, 10);
    }

    public static parse(data: unknown): Result<WakapiTimeEntry> {
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
                timeRange: TimeRange.create({
                    from: parsed.start_time,
                    to: parsed.end_time,
                }),
                project: parsed.project,
            }),
        );
    }
}
