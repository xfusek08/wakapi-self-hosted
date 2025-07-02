type ConversionOptions = {
    rounding: 'round' | 'floor' | 'ceil' | 'float';
    modulo: boolean;
};

const DefaultConversionOptions: ConversionOptions = {
    rounding: 'float',
    modulo: false,
};

export default class Duration {
    private constructor(public readonly milliseconds: number) {}

    public static fromTimeRange({ from, to }: { from: Date; to: Date }) {
        return new Duration(to.getTime() - from.getTime());
    }

    public static fromMilliseconds(milliseconds: number) {
        return new Duration(milliseconds);
    }

    public static fromSeconds(seconds: number) {
        return new Duration(Duration.secondsToMs(seconds));
    }

    public static fromMinutes(minutes: number) {
        return new Duration(Duration.minutesToMs(minutes));
    }

    public static fromHours(hours: number) {
        return new Duration(Duration.hoursToMs(hours));
    }

    public static fromDays(days: number) {
        return new Duration(Duration.daysToMs(days));
    }

    public get seconds() {
        return Duration.msToSeconds(this.milliseconds, {
            rounding: 'floor',
            modulo: true,
        });
    }

    public get minutes() {
        return Duration.msToMinutes(this.milliseconds, {
            rounding: 'floor',
            modulo: true,
        });
    }

    public get hours() {
        return Duration.msToHours(this.milliseconds, {
            rounding: 'floor',
            modulo: true,
        });
    }

    public get days() {
        return Duration.msToDays(this.milliseconds, {
            rounding: 'floor',
            modulo: true,
        });
    }

    public add(other: Duration): Duration {
        return new Duration(this.milliseconds + other.milliseconds);
    }

    public addMilliseconds(milliseconds: number): Duration {
        return new Duration(this.milliseconds + milliseconds);
    }

    public addSeconds(seconds: number): Duration {
        return new Duration(this.milliseconds + Duration.secondsToMs(seconds));
    }

    public addMinutes(minutes: number): Duration {
        return new Duration(this.milliseconds + Duration.minutesToMs(minutes));
    }

    public addHours(hours: number): Duration {
        return new Duration(this.milliseconds + Duration.hoursToMs(hours));
    }

    public addDays(days: number): Duration {
        return new Duration(this.milliseconds + Duration.daysToMs(days));
    }

    public asFormattedString(): string {
        return `${this.days}d ${this.hours}h ${this.minutes}m ${this.seconds}s`;
    }

    public isLongerThan(other: Duration): boolean {
        return this.milliseconds > other.milliseconds;
    }

    public diffLength(other: Duration): number {
        return this.milliseconds - other.milliseconds;
    }

    public clone(): Duration {
        return new Duration(this.milliseconds);
    }

    public static secondsToMs(seconds: number): number {
        return seconds * 1000;
    }

    public static minutesToMs(minutes: number): number {
        return minutes * 60 * 1000;
    }

    public static hoursToMs(hours: number): number {
        return hours * 60 * 60 * 1000;
    }

    public static daysToMs(days: number): number {
        return days * 24 * 60 * 60 * 1000;
    }

    public static msToSeconds(
        milliseconds: number,
        options: ConversionOptions = DefaultConversionOptions,
    ): number {
        return this.applyConversionOptions(milliseconds / 1000, {
            ...options,
            modValue: 60,
        });
    }

    public static msToMinutes(
        milliseconds: number,
        options: ConversionOptions = DefaultConversionOptions,
    ): number {
        return this.applyConversionOptions(milliseconds / (1000 * 60), {
            ...options,
            modValue: 60,
        });
    }

    public static msToHours(
        milliseconds: number,
        options: ConversionOptions = DefaultConversionOptions,
    ): number {
        return this.applyConversionOptions(milliseconds / (1000 * 60 * 60), {
            ...options,
            modValue: 24,
        });
    }

    public static msToDays(
        milliseconds: number,
        options: ConversionOptions = DefaultConversionOptions,
    ): number {
        return this.applyConversionOptions(
            milliseconds / (1000 * 60 * 60 * 24),
            options,
        );
    }

    private static applyConversionOptions(
        value: number,
        options: ConversionOptions & { modValue?: number },
    ): number {
        let tmpValue = value;
        const { rounding, modulo, modValue } = options;
        switch (rounding) {
            case 'round':
                tmpValue = Math.round(tmpValue);
                break;
            case 'floor':
                tmpValue = Math.floor(tmpValue);
                break;
            case 'ceil':
                tmpValue = Math.ceil(tmpValue);
        }
        if (modulo && modValue !== undefined) {
            tmpValue = tmpValue % modValue;
        }
        return tmpValue;
    }
}
