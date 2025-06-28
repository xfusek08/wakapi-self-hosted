import formatDate from '../utility-functions/formatDate';
import roundDateToQuarterHour from '../utility-functions/roundDateToQuaterHour';
import TimeRange from './TimeRange';

export default class TimeRangePartial {
    private constructor(
        public readonly from: Date | null,
        public readonly to: Date | null,
        private readonly timeRange = from && to
            ? TimeRange.create({ from, to })
            : null,
    ) {}

    public static create({
        from,
        to,
    }: {
        from: Date | null;
        to: Date | null;
    }): TimeRangePartial {
        return new TimeRangePartial(from, to);
    }

    public get milliseconds(): number {
        return this.timeRange?.milliseconds ?? Infinity;
    }

    public get seconds() {
        return this.timeRange?.seconds ?? Infinity;
    }

    public get minutes() {
        return this.timeRange?.minutes ?? Infinity;
    }

    public get hours() {
        return this.timeRange?.hours ?? Infinity;
    }

    public get days() {
        return this.timeRange?.days ?? Infinity;
    }

    public asFormattedDurationString(): string {
        return this.timeRange?.asFormattedDurationString() ?? 'N/A';
    }

    public asFormattedDateRangeString(): string {
        const fromFormatted = this.from ? formatDate(this.from) : 'N/A';
        const toFormatted = this.to ? formatDate(this.to) : 'N/A';
        return `${fromFormatted} - ${toFormatted}`;
    }

    public roundToNearestQuarterHour(): TimeRangePartial {
        const fromRounded = this.from
            ? roundDateToQuarterHour(this.from)
            : null;
        const toRounded = this.to ? roundDateToQuarterHour(this.to) : null;
        return new TimeRangePartial(fromRounded, toRounded);
    }

    public startsBeforeOtherStarts(
        other: TimeRangePartial | TimeRange,
    ): boolean {
        if (this.from === null || other.from === null) {
            return false;
        }
        return this.from < other.from;
    }

    public endsBeforeOtherEnds(other: TimeRangePartial | TimeRange): boolean {
        if (this.to === null || other.to === null) {
            return false;
        }
        return this.to < other.to;
    }

    public startsBeforeOtherEnds(other: TimeRangePartial | TimeRange): boolean {
        if (this.from === null || other.to === null) {
            return false;
        }
        return this.from < other.to;
    }

    public endsBeforeOtherStarts(other: TimeRangePartial | TimeRange): boolean {
        if (this.to === null || other.from === null) {
            return false;
        }
        return this.to < other.from;
    }

    public isLongerThan(other: TimeRangePartial | TimeRange): boolean {
        return this.milliseconds > other.milliseconds;
    }

    public diffStart(other: TimeRangePartial | TimeRange): number {
        if (this.from === null || other.from === null) {
            return 0;
        }
        return this.from.getTime() - other.from.getTime();
    }

    public diffEnd(other: TimeRangePartial | TimeRange): number {
        if (this.to === null || other.to === null) {
            return 0;
        }
        return this.to.getTime() - other.to.getTime();
    }

    public diffLength(other: TimeRangePartial | TimeRange): number {
        return this.milliseconds - other.milliseconds;
    }

    public clone(): TimeRangePartial {
        return TimeRangePartial.create({ from: this.from, to: this.to });
    }
}
