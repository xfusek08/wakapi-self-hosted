import { RepositoryQuery } from '../../../domain/common/ports/RepositoryQuery';
import TimeRange from '../../../domain/common/ports/TimeRange';
import TimeRecord from '../../../domain/common/ports/TimeRecord';
import { Result } from '../../../domain/utils/type-utils';
import SolidtimeApi from './SolidtimeApi';
import { SolidTimeProject } from './SolidTimeProject';

export default class SolidtimeRepositoryQuery
    implements RepositoryQuery<SolidTimeProject>
{
    private constructor(private readonly _api: SolidtimeApi) {}

    static create(
        configuration: SolidtimeApi,
    ): Result<SolidtimeRepositoryQuery> {
        return Result.ok(new SolidtimeRepositoryQuery(configuration));
    }

    async getProjects(): Promise<Result<SolidTimeProject[]>> {
        return Result.ensure(async () => {
            const response = await this._api.getProjects();
            return response.assert().data;
        });
    }

    getRecordsForProject({
        project,
        timeRange,
    }: {
        project: SolidTimeProject;
        timeRange: TimeRange;
    }): Promise<Result<TimeRecord[]>> {
        return Result.ensure(async () => {
            const timeEntries = await Result.asyncAssert(
                this._api.getTimeEntries({
                    timeRange,
                    project,
                }),
            );

            return timeEntries.data.map((e) => ({
                ...e,
                timeRange: TimeRange.create({
                    from: e.start,
                    to: e.end,
                }),
                project,
            }));
        });
    }
}
