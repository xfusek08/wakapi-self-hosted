import { values } from 'bunner/framework';

import Report, { reportPrintToString } from '../common/ports/Report';
import RepositoryMutator from '../common/ports/RepositoryMutator';
import RepositoryQuery from '../common/ports/RepositoryQuery';
import RepositoryQueryProcessor from '../common/RepositoryQueryProcessor';
import TimeRange from '../common/utility-classes/TimeRange';
import { Result } from '../common/utility-types/Result';

export default class OutputProcessor {
    private constructor(
        private readonly _outputRepositoryQuery: RepositoryQuery,
        private readonly _outputRepositoryMutator: RepositoryMutator,
    ) {}

    static create({
        outputRepositoryQuery,
        outputRepositoryMutator,
    }: {
        outputRepositoryQuery: RepositoryQuery;
        outputRepositoryMutator: RepositoryMutator;
    }): Result<OutputProcessor> {
        return Result.ok(
            new OutputProcessor(outputRepositoryQuery, outputRepositoryMutator),
        );
    }

    public async processReport(inputReport: Report) {
        return Result.ensure(async () => {
            console.log('\nOutputProcessor: Processing input record:\n');
            console.log(reportPrintToString(inputReport));

            console.log('\nOutputProcessor: Fetching output report:\n');
            const currentOutputReport = await Result.asyncAssert(
                this.fetchOutputReport(inputReport.timeRange),
            );
            console.log(reportPrintToString(currentOutputReport));

            for (const inputEntry of values(inputReport.entries)) {
                const exists =
                    currentOutputReport.entries[inputEntry.identifier];
                if (!exists) {
                    await this._outputRepositoryMutator.pushEntry(inputEntry);
                } else {
                    console.log(
                        `OutputProcessor: Entry with identifier ${inputEntry.identifier} already exists in output report.`,
                    );
                }
            }
        });
    }

    public async fetchOutputReport(
        timeRange: TimeRange,
    ): Promise<Result<Report>> {
        return Result.ensure(async () => {
            const processor = RepositoryQueryProcessor.create(
                this._outputRepositoryQuery,
            ).assert();
            return await processor.generateReport(timeRange);
        });
    }
}
