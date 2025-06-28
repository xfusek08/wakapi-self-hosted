import { TextBuilder } from 'bunner/framework';

import TimeRange from './TimeRange';
import TimeRecord from './TimeRecord';

export default interface Report {
    readonly timeRange: TimeRange;
    readonly records: TimeRecord[];
}

export function reportPrintToString(report: Report): string {
    const tb = new TextBuilder();
    tb.line(
        `Input reports in range: ${report.timeRange.asFormattedDateRangeString()}:`,
    );
    tb.line();
    tb.indent();
    for (const record of report.records) {
        tb.aligned([
            record.project.getIdentifier(),
            record.timeRange.asFormattedDateRangeString(),
            '|',
            record.timeRange.asFormattedDurationString(),
        ]);
    }
    tb.unindent();
    tb.line();
    return tb.render();
}
