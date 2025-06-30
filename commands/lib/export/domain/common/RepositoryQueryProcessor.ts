import Report from './ports/Report';
import { RepositoryQuery } from './ports/RepositoryQuery';
import TimeRange from './utility-classes/TimeRange';
import indexBy from './utility-functions/indexBy';
import { Result } from './utility-types/Result';

export default class RepositoryQueryProcessor {
    private constructor(private readonly _repositoryQuery: RepositoryQuery) {}

    public static create(
        inputRepositoryQuery: RepositoryQuery,
    ): Result<RepositoryQueryProcessor> {
        return Result.ok(new RepositoryQueryProcessor(inputRepositoryQuery));
    }

    public async generateReport(timeRange: TimeRange): Promise<Result<Report>> {
        return Result.ensure(async () => {
            const entries = await Result.asyncAssert(
                this._repositoryQuery.getTimeEntries(timeRange),
            );

            entries.sort((a, b) => a.timeRange.diffStart(b.timeRange));

            return {
                timeRange,
                entries: indexBy(entries, (entry) => entry.identifier, true),
            };
        });
    }
}
