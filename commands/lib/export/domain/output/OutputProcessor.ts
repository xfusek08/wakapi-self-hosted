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
            for (const report of outputReport.records) {
                tb.aligned([
                    report.project.getIdentifier(),
                    report.from.toISOString(),
                    report.to.toISOString(),
                ]);
            }
            console.log(tb.render());
        });
    }
}
