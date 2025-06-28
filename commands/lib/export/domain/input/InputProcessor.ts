import Report from '../common/ports/Report';
import { RepositoryQuery } from '../common/ports/RepositoryQuery';
import RepositoryQueryProcessor from '../common/RepositoryQueryProcessor';
import TimeRange from '../common/utility-classes/TimeRange';
import { Result } from '../common/utility-types/Result';

export default class InputProcessor {
    private constructor(
        private readonly _inputRepositoryQuery: RepositoryQuery,
    ) {}

    public static create({
        inputRepositoryQuery,
    }: {
        inputRepositoryQuery: RepositoryQuery;
    }): Result<InputProcessor> {
        return Result.ok(new InputProcessor(inputRepositoryQuery));
    }

    public async generateReport(timeRange: TimeRange): Promise<Result<Report>> {
        return Result.ensure(async () => {
            const processor = RepositoryQueryProcessor.create(
                this._inputRepositoryQuery,
            ).assert();
            const res = await processor.generateReport(timeRange);
            return res;
        });
    }
}
