import { Result } from '../utils/type-utils';
import { OutputRepositoryQuery } from './ports/OutputRepositoryQuery';
import { OutputRepositoryMutator } from './ports/OutputRepositoryMutator';
import Report from '../common/ports/Report';
import { TextBuilder } from 'bunner/framework';

export default class OutputProcessor {
    private constructor(
        private readonly _outputRepositoryQuery: OutputRepositoryQuery,
        private readonly _outputRepositoryMutator: OutputRepositoryMutator,
    ) {}

    static create({
        outputRepositoryQuery,
        outputRepositoryMutator,
    }: {
        outputRepositoryQuery: OutputRepositoryQuery;
        outputRepositoryMutator: OutputRepositoryMutator;
    }): Result<OutputProcessor> {
        return Result.ok(
            new OutputProcessor(outputRepositoryQuery, outputRepositoryMutator),
        );
    }

    public async processReport(outputReport: Report) {
        return Result.ensure(() => {
            const tb = new TextBuilder();
            tb.line(
                `Input reports in rage:  ${outputReport.timeRange.asFormattedDateRangeString()}:`,
            );
            tb.line();
            tb.indent();
            for (const report of outputReport.records) {
                tb.aligned([
                    report.project.getIdentifier(),
                    report.timeRange.asFormattedDateRangeString(),
                    '|',
                    report.timeRange.asFormattedDurationString(),
                ]);
            }
            tb.unindent();
            tb.line();

            console.log(tb.render());
        });
    }
}
