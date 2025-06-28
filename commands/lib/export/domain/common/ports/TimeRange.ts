import formatDate from '../../utils/formatDate';
import roundDateToQuarterHour from '../../utils/roundDateToQuaterHour';

export default class TimeRange {
    private constructor(
        public readonly from: Date | null,
        public readonly to: Date | null,
    ) {}

    public static create({ from, to }: { from: Date | null; to: Date | null }) {
        return new TimeRange(from, to);
    }

    public get milliseconds(): number {
        if (this.from === null || this.to === null) {
            return 0;
        }
        return this.to.getTime() - this.from.getTime();
    }

    public get seconds() {
        return Math.floor((this.milliseconds / 1000) % 60);
    }
    public get minutes() {
        return Math.floor((this.milliseconds / (1000 * 60)) % 60);
    }
    public get hours() {
        return Math.floor((this.milliseconds / (1000 * 60 * 60)) % 24);
    }
    public get days() {
        return Math.floor(this.milliseconds / (1000 * 60 * 60 * 24));
    }

    public asFormattedDurationString(): string {
        if (this.from === null || this.to === null) {
            return 'N/A';
        }
        return `${this.days}d ${this.hours}h ${this.minutes}m ${this.seconds}s`;
    }

    public asFormattedDateRangeString(): string {
        const fromFormatted = this.from ? formatDate(this.from) : 'N/A';
        const toFormatted = this.to ? formatDate(this.to) : 'N/A';
        return `${fromFormatted} - ${toFormatted}`;
    }

    public roundToNearestQuarterHour(): TimeRange {
        const fromRounded = this.from
            ? roundDateToQuarterHour(this.from)
            : null;
        const toRounded = this.to ? roundDateToQuarterHour(this.to) : null;
        return new TimeRange(fromRounded, toRounded);
    }

    public isBefore(other: TimeRange): boolean {
        if (this.from === null || other.from === null) {
            return false;
        }
        return this.from < other.from;
    }

    public endsBefore(other: TimeRange): boolean {
        if (this.to === null || other.from === null) {
            return false;
        }
        return this.to < other.from;
    }

    public isLongerThan(other: TimeRange): boolean {
        return this.milliseconds > other.milliseconds;
    }

    public diffStart(other: TimeRange): number {
        if (this.from === null || other.from === null) {
            return 0;
        }
        return this.from.getTime() - other.from.getTime();
    }

    public diffEnd(other: TimeRange): number {
        if (this.to === null || other.to === null) {
            return 0;
        }
        return this.to.getTime() - other.to.getTime();
    }

    public diffLength(other: TimeRange): number {
        return this.milliseconds - other.milliseconds;
    }

    public clone(): TimeRange {
        return TimeRange.create({ from: this.from, to: this.to });
    }
}
