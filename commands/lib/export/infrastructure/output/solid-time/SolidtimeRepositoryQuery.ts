import { RepositoryQuery } from '../../../domain/common/ports/RepositoryQuery';
import TimeEntry from '../../../domain/common/ports/TimeEntry';
import TimeRange from '../../../domain/common/utility-classes/TimeRange';
import TimeRangePartial from '../../../domain/common/utility-classes/TimeRangePartial';
import indexBy from '../../../domain/common/utility-functions/indexBy';
import { Result } from '../../../domain/common/utility-types/Result';
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

    private async getProjects(): Promise<SolidTimeProject[]> {
        const response = await this._api.getProjects();
        return response.assert().data;
    }

    public async getTimeEntries(
        timeRange: TimeRange,
    ): Promise<Result<TimeEntry<SolidTimeProject>[]>> {
        return Result.ensure(async () => {
            const projects = await this.getProjects();
            const projectIndex = indexBy(projects, (p) => p.id);

            const projectById = (id: string | null) => {
                if (!id) {
                    return null;
                }
                const project = projectIndex[id];
                if (!project) {
                    throw new Error(`Project with ID ${id} not found`);
                }
                return project[0] ?? null;
            };

            const response = await this._api.getTimeEntries({ timeRange });
            return response.assert().data.map((e) => ({
                ...e,
                timeRange: TimeRangePartial.create({
                    from: e.start,
                    to: e.end,
                }),
                project: projectById(e.project_id),
            }));
        });
    }
}
