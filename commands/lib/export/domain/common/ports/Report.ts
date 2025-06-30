import { TextBuilder } from 'bunner/framework';

import TimeRange from '../utility-classes/TimeRange';
import TimeEntry from './TimeEntry';

export default interface Report {
    readonly timeRange: TimeRange;
    readonly entries: Record<string, TimeEntry>;
}

export function reportPrintToString(report: Report): string {
    const tb = new TextBuilder();
    tb.line(
        `Reports in range: ${report.timeRange.asFormattedDateRangeString()}:`,
    );
    tb.line();
    tb.indent();
    for (const record of Object.values(report.entries)) {
        tb.aligned([
            record.displayName,
            record.project.displayName,
            record.timeRange.asFormattedDateRangeString(),
            '|',
            record.timeRange.asFormattedDurationString(),
        ]);
    }
    tb.unindent();
    tb.line();
    return tb.render();
}
