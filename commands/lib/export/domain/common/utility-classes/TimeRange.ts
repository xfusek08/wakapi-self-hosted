import formatDate from '../utility-functions/formatDate';
import roundDateToQuarterHour from '../utility-functions/roundDateToQuaterHour';
import Duration from './Duration';

export default class TimeRange {
    private constructor(
        public readonly from: Date,
        public readonly to: Date,
        public readonly duration: Duration = Duration.fromTimeRange({
            from,
            to,
        }),
    ) {}

    public static create({ from, to }: { from: Date; to: Date }) {
        return new TimeRange(from, to);
    }

    public asFormattedString(): string {
        return `${formatDate(this.from)} - ${formatDate(this.to)}`;
    }

    public roundToNearestQuarterHour(): TimeRange {
        const fromRounded = roundDateToQuarterHour(this.from);
        const toRounded = roundDateToQuarterHour(this.to);
        return new TimeRange(fromRounded, toRounded);
    }

    public startsBeforeOtherStarts(other: TimeRange): boolean {
        return this.from < other.from;
    }

    public endsBeforeOtherEnds(other: TimeRange): boolean {
        return this.to < other.from;
    }

    public startsBeforeOtherEnds(other: TimeRange): boolean {
        return this.from < other.to;
    }

    public endsBeforeOtherStarts(other: TimeRange): boolean {
        return this.to < other.from;
    }

    public isLongerThan(other: TimeRange): boolean {
        return this.duration.isLongerThan(other.duration);
    }

    public diffStart(other: TimeRange): number {
        return this.from.getTime() - other.from.getTime();
    }

    public diffEnd(other: TimeRange): number {
        return this.to.getTime() - other.to.getTime();
    }

    public diffLength(other: TimeRange): number {
        return this.duration.diffLength(other.duration);
    }

    public isIntersecting(other: TimeRange): boolean {
        return (
            this.startsBeforeOtherEnds(other) &&
            this.endsBeforeOtherStarts(other) === false
        );
    }

    public clone(): TimeRange {
        return TimeRange.create({ from: this.from, to: this.to });
    }
}
