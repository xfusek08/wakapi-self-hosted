import Report, { reportPrintToString } from '../common/ports/Report';
import { RepositoryQuery } from '../common/ports/RepositoryQuery';
import RepositoryQueryProcessor from '../common/RepositoryQueryProcessor';
import TimeRange from '../common/utility-classes/TimeRange';
import { Result } from '../common/utility-types/Result';
import { OutputRepositoryMutator } from './ports/OutputRepositoryMutator';

export default class OutputProcessor {
    private constructor(
        private readonly _outputRepositoryQuery: RepositoryQuery,
        private readonly _outputRepositoryMutator: OutputRepositoryMutator,
    ) {}

    static create({
        outputRepositoryQuery,
        outputRepositoryMutator,
    }: {
        outputRepositoryQuery: RepositoryQuery;
        outputRepositoryMutator: OutputRepositoryMutator;
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
