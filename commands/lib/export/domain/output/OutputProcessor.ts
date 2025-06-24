import { Result } from '../../utils/type-utils';
import { OutputRepositoryQuery } from './ports/OutputRepositoryQuery';
import { OutputRepositoryMutator } from './ports/OutputRepositoryMutator';
import Report from '../common/ports/Report';

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
            throw new Error('Not implemented - processReport');
        });
    }
}
