import { Cache, isNotNil } from 'bunner/framework';

import Project from '../../../domain/common/ports/Project';
import RepositoryMutator from '../../../domain/common/ports/RepositoryMutator';
import RepositoryQuery from '../../../domain/common/ports/RepositoryQuery';
import TimeEntry from '../../../domain/common/ports/TimeEntry';
import TimeRange from '../../../domain/common/utility-classes/TimeRange';
import extractTagFromString from '../../../domain/common/utility-functions/extractTagFromString';
import indexBy from '../../../domain/common/utility-functions/indexBy';
import { Result } from '../../../domain/common/utility-types/Result';
import SolidtimeApi, {
    SolidTimeApiEntry,
    SolidTimeApiProject,
} from './SolidtimeApi';
import SolidTimeEntry from './SolidTimeEntry';
import SolidTimeProject from './SolidTimeProject';

export default class SolidtimeRepository
    implements
        RepositoryQuery<SolidTimeProject>,
        RepositoryMutator<SolidTimeEntry>
{
    private constructor(
        private readonly _api: SolidtimeApi,
        private readonly _cache = Cache.create(),
    ) {}

    static create(configuration: SolidtimeApi): Result<SolidtimeRepository> {
        return Result.ok(new SolidtimeRepository(configuration));
    }

    public async getProjects(): Promise<SolidTimeProject[]> {
        return this._cache.cached('getProjects', async () => {
            const projects = await this._api.getProjects();
            return projects.data
                .map(this.apiProjectToSolidTimeProject)
                .filter(isNotNil);
        });
    }

    private async getProjectById(
        id: string | null,
    ): Promise<SolidTimeProject | null> {
        if (!id) {
            return null;
        }

        const index = await this._cache.cached(
            'getProjectById-index',
            async () => {
                const projects = await this.getProjects();
                return indexBy(projects, (p) => p.id, true);
            },
        );

        return index[id] ?? null;
    }

    public async getTimeEntries(
        timeRange: TimeRange,
    ): Promise<Result<SolidTimeEntry[]>> {
        return Result.ensure(async () => {
            const response = await this._api.getTimeEntries({ timeRange });
            const entries: SolidTimeEntry[] = [];
            for (const entry of response.data) {
                const solidTimeEntry =
                    await this.apiEntryToSolidTimeEntry(entry);
                if (!solidTimeEntry) {
                    continue;
                }
                entries.push(solidTimeEntry);
            }
            return entries;
        });
    }

    public async pushEntry(record: TimeEntry): Promise<SolidTimeEntry> {
        const solidTimeProject = await this.ensureOutputProjectExists(
            record.project,
        );

        const entry = await this._api.createTimeEntry({
            start: record.timeRange.from,
            end: record.timeRange.to,
            description: `[${record.identifier}] ${record.displayName}`,
            projectId: solidTimeProject.id,
        });

        const solidTimeEntry = await this.apiEntryToSolidTimeEntry(entry.data);
        if (!solidTimeEntry) {
            console.log('entry.data', entry.data);
            throw new Error(
                `Entry created (${entry.data.id}) for project ${solidTimeProject.displayName} but could not convert to SolidTimeEntry.`,
            );
        }

        console.log(
            `Entry created: [${solidTimeEntry.identifier}] ${solidTimeEntry.displayName} (${solidTimeEntry.id}) for project ${solidTimeProject.displayName} (${solidTimeProject.id})`,
        );

        return solidTimeEntry;
    }

    private async ensureOutputProjectExists(
        project: Project,
    ): Promise<SolidTimeProject> {
        const projects = await this.getProjects();
        const solidTimeProject = projects.find(
            (p) => p.identifier === project.identifier,
        );

        if (solidTimeProject) {
            return solidTimeProject;
        }

        const newSolidTimeProjectRaw = await this._api.createProject({
            name: `[${project.identifier}] ${project.displayName}`,
        });

        this._cache.invalidate();

        const newSolidTimeProject = this.apiProjectToSolidTimeProject(
            newSolidTimeProjectRaw.data,
        );

        if (!newSolidTimeProject) {
            throw new Error(
                `Failed to create SolidTime project for ${project.displayName}`,
            );
        }

        return newSolidTimeProject;
    }

    private apiProjectToSolidTimeProject(
        project: SolidTimeApiProject,
    ): SolidTimeProject | null {
        const { identifier, name } = extractTagFromString(project.name);
        if (!identifier) {
            return null;
        }
        return {
            id: project.id,
            displayName: name,
            identifier,
        };
    }

    private async apiEntryToSolidTimeEntry(
        entry: SolidTimeApiEntry,
    ): Promise<SolidTimeEntry | null> {
        if (entry.end === null) {
            console.warn(
                `Skipping entry with ID ${entry.id} because it has no end time.`,
            );
            return null;
        }

        const project = await this.getProjectById(entry.project_id);
        if (!project) {
            console.warn(
                `Skipping entry with ID ${entry.id} because it has no associated project.`,
            );
            return null;
        }

        const { identifier, name } = extractTagFromString(
            entry.description ?? '',
        );
        if (!identifier) {
            console.warn(
                `Skipping entry with ID ${entry.id} because it has no identifier in its description.`,
            );
            return null;
        }

        return {
            ...entry,
            timeRange: TimeRange.create({
                from: entry.start,
                to: entry.end,
            }),
            project,
            displayName: name,
            identifier,
        };
    }
}
