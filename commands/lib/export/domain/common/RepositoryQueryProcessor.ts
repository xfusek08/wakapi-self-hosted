import { Result } from '../utils/type-utils';
import Report from './ports/Report';
import { RepositoryQuery } from './ports/RepositoryQuery';
import TimeRange from './ports/TimeRange';
import TimeRecord from './ports/TimeRecord';

export default class RepositoryQueryProcessor {
    private constructor(private readonly _repositoryQuery: RepositoryQuery) {}

    public static create(
        inputRepositoryQuery: RepositoryQuery,
    ): Result<RepositoryQueryProcessor> {
        return Result.ok(new RepositoryQueryProcessor(inputRepositoryQuery));
    }

    public async generateReport(timeRange: TimeRange): Promise<Result<Report>> {
        return Result.ensure(async () => {
            const projectsResult = await Result.asyncAssert(
                this._repositoryQuery.getProjects(timeRange),
            );
            const allRecords: TimeRecord[] = [];
            for (const project of projectsResult) {
                const records = await Result.asyncAssert(
                    this._repositoryQuery.getRecordsForProject({
                        project,
                        timeRange,
                    }),
                );
                allRecords.push(...records);
            }

            allRecords.sort((a, b) => a.timeRange.diffStart(b.timeRange));

            return {
                timeRange,
                records: allRecords,
            };
        });
    }
}
