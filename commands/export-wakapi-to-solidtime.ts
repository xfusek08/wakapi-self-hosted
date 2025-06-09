import { defineCommand, log } from 'bunner/framework';
import { Database } from 'bun:sqlite';

// Domain Models
interface TimeEntry {
    id: string;
    start: string;
    duration: number;
    project: string;
}

interface Organization {
    id: string;
    name: string;
}

interface Project {
    id: string;
    name: string;
}

interface WakapiTimeChunk {
    chunk_id: number;
    project: string;
    start_time: string;
    end_time: string;
    duration: string;
}

interface WakapiProjectSummary {
    project: string;
    total_seconds: number;
    formatted_time: string;
}

// Internal domain models for time log records
interface TimeLogRecord {
    projectName: string;
    startTime: Date;
    endTime: Date;
    durationSeconds: number;
    description: string;
}

interface DateRange {
    from: Date;
    to: Date;
}

interface ExportConfiguration {
    solidtimeUrl: string;
    solidtimeApiKey: string;
    organizationId: string;
    wakapiDbPath: string;
    dateRange: DateRange;
    isDryRun: boolean;
}

// Export Result Models
interface ExportSummary {
    totalProjectsProcessed: number;
    totalTimeEntriesCreated: number;
    totalDurationSeconds: number;
    projectResults: ProjectExportResult[];
    errors: ExportError[];
}

interface ProjectExportResult {
    projectName: string;
    timeEntriesCreated: number;
    totalDurationSeconds: number;
    wasNewProject: boolean;
}

interface ExportError {
    projectName?: string;
    message: string;
    timestamp: Date;
}

// Configuration Validator
class ExportConfigurationValidator {
    static validate(config: ExportConfiguration): void {
        const errors: string[] = [];

        if (!config.solidtimeUrl || !config.solidtimeUrl.trim()) {
            errors.push('SolidTime URL is required');
        }

        if (!config.solidtimeApiKey || !config.solidtimeApiKey.trim()) {
            errors.push('SolidTime API key is required');
        }

        if (!config.organizationId || !config.organizationId.trim()) {
            errors.push('Organization ID is required');
        }

        if (!config.wakapiDbPath || !config.wakapiDbPath.trim()) {
            errors.push('Wakapi database path is required');
        }

        if (config.dateRange.from > config.dateRange.to) {
            errors.push('Start date must be before or equal to end date');
        }

        if (errors.length > 0) {
            throw new Error(
                `Configuration validation failed: ${errors.join(', ')}`
            );
        }
    }
}

// Data Transformation Strategy - Strategy Pattern
interface DataTransformationStrategy {
    transform(
        chunk: WakapiTimeChunk,
        projectName: string
    ): TimeLogRecord | null;
}

class WakapiChunkToTimeLogTransformer implements DataTransformationStrategy {
    private readonly minimumDurationSeconds: number;

    constructor(minimumDurationSeconds: number = 30) {
        this.minimumDurationSeconds = minimumDurationSeconds;
    }

    transform(
        chunk: WakapiTimeChunk,
        projectName: string
    ): TimeLogRecord | null {
        const startTime = new Date(chunk.start_time);
        const endTime = new Date(chunk.end_time);
        const durationSeconds = Math.floor(
            (endTime.getTime() - startTime.getTime()) / 1000
        );

        // Filter out chunks that are too short
        if (durationSeconds < this.minimumDurationSeconds) {
            return null;
        }

        return {
            projectName,
            startTime,
            endTime,
            durationSeconds,
            description: this.generateDescription(projectName, durationSeconds),
        };
    }

    private generateDescription(
        projectName: string,
        durationSeconds: number
    ): string {
        const hours = Math.floor(durationSeconds / 3600);
        const minutes = Math.floor((durationSeconds % 3600) / 60);

        let timeDescription = '';
        if (hours > 0) {
            timeDescription = `${hours}h ${minutes}m`;
        } else {
            timeDescription = `${minutes}m`;
        }

        return `Coding session in ${projectName} (${timeDescription} from Wakapi)`;
    }
}

// Utility functions
const formatIsoTimestamp = (date: Date): string =>
    date.toISOString().replace(/\.\d{3}Z$/, 'Z');
const formatDateAsString = (date: Date): string =>
    date.toISOString().split('T')[0];

// Output Repository Interface - Interface Segregation
interface OutputRepositoryInterface {
    getCurrentUserId(): Promise<string>;
    getOrganizationMemberId(orgId: string): Promise<string>;
    getOrganizationProjects(orgId: string): Promise<Project[]>;
    createProject(orgId: string, projectName: string): Promise<Project>;
    createTimeEntry(
        orgId: string,
        memberId: string,
        timeLogRecord: TimeLogRecord,
        projectId: string
    ): Promise<void>;
}

// Real SolidTime API Client Implementation
class SolidTimeApiClient implements OutputRepositoryInterface {
    private cachedUserId: string | null = null;

    constructor(
        private readonly apiUrl: string,
        private readonly apiKey: string
    ) {}

    private async makeApiRequest<T>(
        endpoint: string,
        method = 'GET',
        body?: any
    ): Promise<T> {
        const headers: HeadersInit = {
            Authorization: `Bearer ${this.apiKey}`,
            Accept: 'application/json',
        };

        if (body && method !== 'GET') {
            headers['Content-Type'] = 'application/json';
        }

        const options: RequestInit = {
            method,
            headers,
        };

        if (method !== 'GET' && body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(`${this.apiUrl}${endpoint}`, options);
        const text = await response.text();

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${text}`);
        }

        return text ? (JSON.parse(text) as T) : ({} as T);
    }

    async getCurrentUserId(): Promise<string> {
        if (this.cachedUserId) return this.cachedUserId;

        const endpoint = '/api/v1/users/me';
        try {
            const data = await this.makeApiRequest<{ data: { id: string } }>(
                endpoint
            );
            this.cachedUserId = data.data.id;
            return data.data.id;
        } catch (error) {
            log.info(`Failed to get user ID: ${error}`);
            throw error;
        }
    }

    async getOrganizationMemberId(orgId: string): Promise<string> {
        try {
            const endpoint = `/api/v1/organizations/${orgId}/members`;
            const data = await this.makeApiRequest<any>(endpoint);
            const userId = await this.getCurrentUserId();
            const member = data.data.find((m: any) => m.user_id === userId);

            if (!member) throw new Error('Member not found in organization');
            return member.id;
        } catch (error) {
            log.info(`Failed to get organization member: ${error}`);
            throw error;
        }
    }

    async getOrganizationProjects(orgId: string): Promise<Project[]> {
        const endpoint = `/api/v1/organizations/${orgId}/projects`;
        try {
            const data = await this.makeApiRequest<any>(endpoint);
            return data.data.map((project: any) => ({
                id: project.id,
                name: project.name,
            }));
        } catch (error) {
            log.info(`Failed to get organization projects: ${error}`);
            throw error;
        }
    }

    async createProject(orgId: string, projectName: string): Promise<Project> {
        const endpoint = `/api/v1/organizations/${orgId}/projects`;
        const userId = await this.getCurrentUserId();

        try {
            const data = await this.makeApiRequest<any>(endpoint, 'POST', {
                name: projectName,
                color: '#000000',
                is_billable: true,
                member_ids: [userId],
            });

            return {
                id: data.data.id,
                name: data.data.name,
            };
        } catch (error) {
            log.info(`Failed to create project "${projectName}": ${error}`);
            throw error;
        }
    }

    async createTimeEntry(
        orgId: string,
        memberId: string,
        timeLogRecord: TimeLogRecord,
        projectId: string
    ): Promise<void> {
        const formattedData = {
            member_id: memberId,
            start: formatIsoTimestamp(timeLogRecord.startTime),
            end: formatIsoTimestamp(timeLogRecord.endTime),
            duration: timeLogRecord.durationSeconds,
            billable: false,
            project_id: projectId,
            description: timeLogRecord.description,
            tags: [],
        };

        try {
            const endpoint = `/api/v1/organizations/${orgId}/time-entries`;
            await this.makeApiRequest<{ data: { id: string } }>(
                endpoint,
                'POST',
                formattedData
            );
            log.info(
                `Time entry created: ${timeLogRecord.description} (${timeLogRecord.durationSeconds}s)`
            );
        } catch (error) {
            log.info(`Failed to create time entry: ${error}`);
            throw error;
        }
    }
}

// Dry Run Implementation - No actual API calls
class DryRunOutputRepository implements OutputRepositoryInterface {
    private cachedUserId: string = 'dry-run-user-id';
    private readonly projectIdCounter = new Map<string, number>();

    async getCurrentUserId(): Promise<string> {
        return this.cachedUserId;
    }

    async getOrganizationMemberId(orgId: string): Promise<string> {
        const memberId = `dry-run-member-${orgId}`;
        log.info(`[DRY RUN] Would get organization member: ${memberId}`);
        return memberId;
    }

    async getOrganizationProjects(orgId: string): Promise<Project[]> {
        const mockProjects: Project[] = [
            { id: 'dry-run-project-1', name: 'Mock Project 1' },
            { id: 'dry-run-project-2', name: 'Mock Project 2' },
        ];
        log.info(
            `[DRY RUN] Would get organization projects: ${mockProjects.length} projects`
        );
        return mockProjects;
    }

    async createProject(orgId: string, projectName: string): Promise<Project> {
        const counter = this.projectIdCounter.get(projectName) || 0;
        this.projectIdCounter.set(projectName, counter + 1);

        const project: Project = {
            id: `dry-run-project-${projectName}-${counter}`,
            name: projectName,
        };

        log.info(`[DRY RUN] Would create project: ${projectName}`);
        return project;
    }

    async createTimeEntry(
        orgId: string,
        memberId: string,
        timeLogRecord: TimeLogRecord,
        projectId: string
    ): Promise<void> {
        log.info(
            `[DRY RUN] Would create time entry: ${timeLogRecord.startTime.toISOString()} - ${timeLogRecord.endTime.toISOString()} (${
                timeLogRecord.durationSeconds
            }s) for ${timeLogRecord.projectName}`
        );
    }
}

// Wakapi Database Repository - Single Responsibility
class WakapiTimeDataRepository {
    private readonly dataTransformer: DataTransformationStrategy;

    constructor(
        private readonly database: Database,
        dataTransformer?: DataTransformationStrategy
    ) {
        this.dataTransformer =
            dataTransformer ?? new WakapiChunkToTimeLogTransformer();
    }

    async getProjectNamesForDateRange(dateRange: DateRange): Promise<string[]> {
        const projectNames = new Set<string>();
        const currentDate = new Date(dateRange.from);

        while (currentDate <= dateRange.to) {
            const dateStr = formatDateAsString(currentDate);
            const nextDay = new Date(currentDate);
            nextDay.setDate(nextDay.getDate() + 1);
            const nextDayStr = formatDateAsString(nextDay);

            const summaries = await this.getProjectSummariesForSingleDate(
                dateStr,
                nextDayStr
            );
            summaries.forEach((summary) => projectNames.add(summary.project));

            currentDate.setDate(currentDate.getDate() + 1);
        }

        return Array.from(projectNames);
    }

    private async getProjectSummariesForSingleDate(
        dateStr: string,
        nextDayStr: string
    ): Promise<WakapiProjectSummary[]> {
        const query = `
            WITH
                heartbeats_with_gap AS (
                    SELECT
                        *,
                        (
                            strftime('%s', time) - strftime(
                                '%s',
                                LAG(time) OVER (
                                    PARTITION BY project
                                    ORDER BY time
                                )
                            )
                        ) AS gap,
                        LAG(project) OVER (ORDER BY time) AS prev_project
                    FROM heartbeats
                    WHERE time >= ? AND time < ?
                ),
                grouped_heartbeats AS (
                    SELECT
                        *,
                        SUM(
                            CASE
                                WHEN gap > 900 OR project <> prev_project THEN 1
                                ELSE 0
                            END
                        ) OVER (ORDER BY time) AS chunk_id
                    FROM heartbeats_with_gap
                ),
                chunk_data AS (
                    SELECT
                        chunk_id,
                        project,
                        MIN(time) AS start_time,
                        MAX(time) AS end_time
                    FROM grouped_heartbeats
                    GROUP BY chunk_id, project
                )
            SELECT
                project,
                SUM(strftime('%s', end_time) - strftime('%s', start_time)) AS total_seconds
            FROM chunk_data
            GROUP BY project
            ORDER BY total_seconds DESC;
        `;

        const stmt = this.database.prepare(query);
        return stmt.all(dateStr, nextDayStr) as WakapiProjectSummary[];
    }

    async getTimeLogRecordsForProject(
        projectName: string,
        dateRange: DateRange
    ): Promise<TimeLogRecord[]> {
        const allRecords: TimeLogRecord[] = [];
        const currentDate = new Date(dateRange.from);

        while (currentDate <= dateRange.to) {
            const dateStr = formatDateAsString(currentDate);
            const nextDay = new Date(currentDate);
            nextDay.setDate(nextDay.getDate() + 1);
            const nextDayStr = formatDateAsString(nextDay);

            const chunks = await this.getTimeChunksForProjectOnDate(
                projectName,
                dateStr,
                nextDayStr
            );

            const records = this.transformChunksToTimeLogRecords(
                chunks,
                projectName
            );
            allRecords.push(...records);

            currentDate.setDate(currentDate.getDate() + 1);
        }

        return allRecords;
    }

    private async getTimeChunksForProjectOnDate(
        projectName: string,
        dateStr: string,
        nextDayStr: string
    ): Promise<WakapiTimeChunk[]> {
        const query = `
            WITH
                heartbeats_with_gap AS (
                    SELECT
                        *,
                        (
                            strftime('%s', time) - strftime(
                                '%s',
                                LAG(time) OVER (ORDER BY time)
                            )
                        ) AS gap
                    FROM heartbeats
                    WHERE time >= ? AND time < ? AND project = ?
                ),
                grouped_heartbeats AS (
                    SELECT
                        *,
                        SUM(
                            CASE WHEN gap > 900 THEN 1 ELSE 0 END
                        ) OVER (ORDER BY time) AS chunk_id
                    FROM heartbeats_with_gap
                )
            SELECT
                chunk_id,
                project,
                MIN(time) AS start_time,
                MAX(time) AS end_time
            FROM grouped_heartbeats
            GROUP BY chunk_id, project
            ORDER BY start_time;
        `;

        const stmt = this.database.prepare(query);
        return stmt.all(dateStr, nextDayStr, projectName) as WakapiTimeChunk[];
    }

    private transformChunksToTimeLogRecords(
        chunks: WakapiTimeChunk[],
        projectName: string
    ): TimeLogRecord[] {
        return chunks
            .map((chunk) => this.dataTransformer.transform(chunk, projectName))
            .filter((record): record is TimeLogRecord => record !== null);
    }
}

// Project Management Service - Open/Closed Principle
class ProjectManagementService {
    private readonly projectMap = new Map<string, string>();
    private readonly newlyCreatedProjects = new Set<string>();

    constructor(
        private readonly outputRepository: OutputRepositoryInterface,
        private readonly organizationId: string
    ) {}

    async initializeExistingProjects(): Promise<void> {
        const existingProjects =
            await this.outputRepository.getOrganizationProjects(
                this.organizationId
            );
        existingProjects.forEach((project: Project) =>
            this.projectMap.set(project.name, project.id)
        );
        log.info(
            `Loaded ${existingProjects.length} existing projects from output repository`
        );
    }

    async ensureProjectExists(projectName: string): Promise<string> {
        if (this.projectMap.has(projectName)) {
            return this.projectMap.get(projectName)!;
        }

        log.info(`Creating new project: ${projectName}`);
        const newProject = await this.outputRepository.createProject(
            this.organizationId,
            projectName
        );
        this.projectMap.set(projectName, newProject.id);
        this.newlyCreatedProjects.add(projectName);
        return newProject.id;
    }

    isNewlyCreatedProject(projectName: string): boolean {
        return this.newlyCreatedProjects.has(projectName);
    }
}

// Time Entry Export Service - Dependency Inversion Principle
class TimeEntryExportService {
    constructor(
        private readonly outputRepository: OutputRepositoryInterface,
        private readonly projectService: ProjectManagementService,
        private readonly organizationId: string,
        private readonly memberId: string
    ) {}

    async exportTimeLogRecordsForProject(
        projectName: string,
        timeLogRecords: TimeLogRecord[]
    ): Promise<void> {
        log.info(
            `Processing project: ${projectName} with ${timeLogRecords.length} time log records`
        );

        const projectId = await this.projectService.ensureProjectExists(
            projectName
        );

        for (const record of timeLogRecords) {
            await this.exportSingleTimeLogRecord(record, projectId);
        }
    }

    private async exportSingleTimeLogRecord(
        record: TimeLogRecord,
        projectId: string
    ): Promise<void> {
        await this.outputRepository.createTimeEntry(
            this.organizationId,
            this.memberId,
            record,
            projectId
        );
    }
}

// Main Export Orchestrator - Single Responsibility
class WakapiToTimeExportOrchestrator {
    private readonly outputRepository: OutputRepositoryInterface;
    private wakapiRepository!: WakapiTimeDataRepository;
    private projectService!: ProjectManagementService;
    private exportService!: TimeEntryExportService;

    constructor(private readonly config: ExportConfiguration) {
        ExportConfigurationValidator.validate(config);
        this.outputRepository = config.isDryRun
            ? new DryRunOutputRepository()
            : new SolidTimeApiClient(
                  config.solidtimeUrl,
                  config.solidtimeApiKey
              );
    }

    async executeExport(): Promise<void> {
        try {
            await this.initializeServices();
            await this.performExport();
            log.info('Export completed successfully!');
        } catch (error) {
            log.info(`Export failed: ${error}`);
            throw error;
        }
    }

    private async initializeServices(): Promise<void> {
        // Initialize database connection
        const database = new Database(this.config.wakapiDbPath, {
            readonly: true,
        });
        log.info('Connected to Wakapi database');

        this.wakapiRepository = new WakapiTimeDataRepository(database);

        // Initialize output services
        const memberId = await this.outputRepository.getOrganizationMemberId(
            this.config.organizationId
        );
        log.info(`Member ID: ${memberId}`);

        this.projectService = new ProjectManagementService(
            this.outputRepository,
            this.config.organizationId
        );

        await this.projectService.initializeExistingProjects();

        this.exportService = new TimeEntryExportService(
            this.outputRepository,
            this.projectService,
            this.config.organizationId,
            memberId
        );
    }

    private async performExport(): Promise<void> {
        const projectNames =
            await this.wakapiRepository.getProjectNamesForDateRange(
                this.config.dateRange
            );

        log.info(
            `Found ${
                projectNames.length
            } projects to export: ${projectNames.join(', ')}`
        );

        for (const projectName of projectNames) {
            const timeLogRecords =
                await this.wakapiRepository.getTimeLogRecordsForProject(
                    projectName,
                    this.config.dateRange
                );

            if (timeLogRecords.length > 0) {
                await this.exportService.exportTimeLogRecordsForProject(
                    projectName,
                    timeLogRecords
                );
            }
        }
    }
}

export default defineCommand({
    command: 'export-wakapi-to-solidtime',
    description:
        'Exports time tracking data from Wakapi SQLite database to SolidTime using the REST API',
    category: 'backend',
    options: [
        {
            long: 'solidtime-url',
            short: 's',
            description: 'URL of the SolidTime instance to export data to',
            type: 'string',
            required: true,
        },
        {
            long: 'solidtime-key',
            short: 'k',
            description: 'API key for the SolidTime instance',
            type: 'string',
            required: true,
        },
        {
            long: 'solidtime-organization-id',
            short: 'o',
            description: 'ID of the SolidTime organization to export data to',
            type: 'string',
            required: true,
        },
        {
            long: 'wakapi-db-file',
            short: 'f',
            description: 'Path to the Wakapi database file to export from',
            type: 'string',
            required: true,
        },
        {
            long: 'from',
            description: 'Start date for the export in YYYY-MM-DD format',
            type: 'string',
            required: true,
        },
        {
            long: 'to',
            description: 'End date for the export in YYYY-MM-DD format',
            type: 'string',
            required: true,
        },
        {
            long: 'dry-run',
            short: 'd',
            description: 'Run the command without making any changes',
            type: 'boolean',
            default: false,
        },
    ] as const,
    action: async ({ options }) => {
        const config: ExportConfiguration = {
            solidtimeUrl: options['solidtime-url'],
            solidtimeApiKey: options['solidtime-key'],
            organizationId: options['solidtime-organization-id'],
            wakapiDbPath: options['wakapi-db-file'],
            dateRange: {
                from: new Date(options['from']),
                to: new Date(options['to']),
            },
            isDryRun: options['dry-run'],
        };

        log.info(
            `Starting export from ${formatDateAsString(
                config.dateRange.from
            )} to ${formatDateAsString(config.dateRange.to)}`
        );
        log.info(`Wakapi DB: ${config.wakapiDbPath}`);
        log.info(`SolidTime URL: ${config.solidtimeUrl}`);
        log.info(`Organization ID: ${config.organizationId}`);
        log.info(`Dry run: ${config.isDryRun}`);

        const orchestrator = new WakapiToTimeExportOrchestrator(config);
        await orchestrator.executeExport();
    },
});
