import { InputRepositoryQuery } from './ports/InputRepositoryQuery';
import { Result } from '../utils/type-utils';
import Report from '../common/ports/Report';
import TimeRecord from '../common/ports/TimeRecord';
import TimeRange from '../common/ports/TimeRange';

export default class InputProcessor {
    private constructor(
        private readonly _inputRepositoryQuery: InputRepositoryQuery,
    ) {}

    public static create({
        inputRepositoryQuery,
    }: {
        inputRepositoryQuery: InputRepositoryQuery;
    }): Result<InputProcessor> {
        return Result.ok(new InputProcessor(inputRepositoryQuery));
    }

    public async generateReport({
        timeRange,
    }: {
        timeRange: TimeRange;
    }): Promise<Result<Report>> {
        return Result.ensure(async () => {
            const projectsResult = await Result.asyncAssert(
                this._inputRepositoryQuery.getProjects({ timeRange }),
            );

            const allRecords: TimeRecord[] = [];
            for (const project of projectsResult) {
                const records = await Result.asyncAssert(
                    this._inputRepositoryQuery.getRecordsForProject({
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
