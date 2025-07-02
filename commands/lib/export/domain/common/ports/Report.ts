import { TextBuilder } from 'bunner/framework';

import Duration from '../utility-classes/Duration';
import TimeRange from '../utility-classes/TimeRange';
import TimeEntry from './TimeEntry';

export default interface Report {
    readonly timeRange: TimeRange;
    readonly entries: Record<string, TimeEntry>;
}

export function reportPrintToString(report: Report): string {
    const tb = new TextBuilder();
    tb.line(`Reports in range: ${report.timeRange.asFormattedString()}:`);
    tb.line();
    tb.indent();
    let totalDuration = Duration.fromMilliseconds(0);
    for (const record of Object.values(report.entries)) {
        tb.aligned([
            record.displayName,
            record.identifier,
            record.project.displayName,
            record.timeRange.duration.asFormattedString(),
            record.timeRange.asFormattedString(),
        ]);
        totalDuration = totalDuration.add(record.timeRange.duration);
    }
    tb.aligned(['---', '---', '---', '---', '---']);
    tb.aligned(['Total:', '', '', totalDuration.asFormattedString(), '']);
    tb.unindent();
    tb.line();
    return tb.render();
}
