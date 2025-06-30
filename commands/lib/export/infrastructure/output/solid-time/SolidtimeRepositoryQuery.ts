import { RepositoryQuery } from '../../../domain/common/ports/RepositoryQuery';
import TimeRange from '../../../domain/common/utility-classes/TimeRange';
import extractTagFromString from '../../../domain/common/utility-functions/extractTagFromString';
import indexBy from '../../../domain/common/utility-functions/indexBy';
import { Result } from '../../../domain/common/utility-types/Result';
import SolidtimeApi from './SolidtimeApi';
import SolidTimeEntry from './SolidTimeEntry';
import SolidTimeProject from './SolidTimeProject';

export default class SolidtimeRepositoryQuery
    implements RepositoryQuery<SolidTimeProject>
{
    private constructor(private readonly _api: SolidtimeApi) {}

    static create(
        configuration: SolidtimeApi,
    ): Result<SolidtimeRepositoryQuery> {
        return Result.ok(new SolidtimeRepositoryQuery(configuration));
    }

    public async getTimeEntries(
        timeRange: TimeRange,
    ): Promise<Result<SolidTimeEntry[]>> {
        return Result.ensure(async () => {
            // Prepare project map indexed by ID
            // ---------------------------------

            const projects = await this._api.getProjects();
            const projectIndex = indexBy(projects.assert().data, (p) => p.id);
            const projectById = (
                id: string | null,
            ): SolidTimeProject | null => {
                if (!id) {
                    return null;
                }
                const projectArrayRaw = projectIndex[id];
                if (!projectArrayRaw) {
                    throw new Error(`Project with ID ${id} not found`);
                }

                const projectRaw = projectArrayRaw[0] ?? null;
                if (!projectRaw) {
                    return null;
                }

                const identifier = extractTagFromString(projectRaw.name);
                if (!identifier) {
                    return null;
                }

                return {
                    id: projectRaw.id,
                    name: projectRaw.name,
                    displayName: projectRaw.name,
                    identifier,
                };
            };

            // Select all time entries for the tag within the specified time range
            // -------------------------------------------------------------------

            const response = await this._api.getTimeEntries({ timeRange });

            // Filter all incomplete entries and return
            // ----------------------------------------

            const timeEntries: SolidTimeEntry[] = [];
            for (const entry of response.assert().data) {
                if (entry.end === null) {
                    continue;
                }

                const project = projectById(entry.project_id);
                if (!project) {
                    continue;
                }

                const identifier = extractTagFromString(
                    entry.description ?? '',
                );

                if (!identifier) {
                    continue;
                }

                timeEntries.push({
                    ...entry,
                    timeRange: TimeRange.create({
                        from: entry.start,
                        to: entry.end,
                    }),
                    project,
                    displayName: entry.description ?? '',
                    identifier,
                });
            }
            return timeEntries;
        });
    }
}
