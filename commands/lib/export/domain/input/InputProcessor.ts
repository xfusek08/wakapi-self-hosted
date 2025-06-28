import Report from '../common/ports/Report';
import { RepositoryQuery } from '../common/ports/RepositoryQuery';
import TimeRange from '../common/ports/TimeRange';
import RepositoryQueryProcessor from '../common/RepositoryQueryProcessor';
import { Result } from '../utils/type-utils';

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

    public async generateReport({
        timeRange,
    }: {
        timeRange: TimeRange;
    }): Promise<Result<Report>> {
        return Result.ensure(async () => {
            const processor = RepositoryQueryProcessor.create(
                this._inputRepositoryQuery,
            ).assert();
            const res = await processor.generateReport(timeRange);
            return res;
        });
    }
}
