import { Database } from 'bun:sqlite';
import { InputRepositoryQuery } from '../../../domain/input/ports/InputRepositoryQuery';
import { Result } from '../../../utils/type-utils';
import InputProject from '../../../domain/input/ports/InputProject';
import WakapiProject from './WakapiProject';
import InputRecord from '../../../domain/input/ports/InputRecord';

interface ProjectRow {
    project: string;
}

interface TimeFrameRow {
    chunk_id: number;
    project: string;
    start_time: string;
    end_time: string;
}

export class WakapiDatabase implements InputRepositoryQuery {
    private constructor(private readonly _database: Database) {}

    static create({
        wakapiDbPath,
    }: {
        wakapiDbPath: string;
    }): Result<WakapiDatabase> {
        try {
            const db = new Database(wakapiDbPath, { readonly: true });
            return Result.ok(new WakapiDatabase(db));
        } catch (error) {
            return Result.error(
                `Failed to connect to Wakapi database: ${
                    error instanceof Error ? error.message : String(error)
                }`,
            );
        }
    }

    public async getProjects(range: {
        from: Date;
        to: Date;
    }): Promise<Result<InputProject[]>> {
        try {
            const query = this._database.query<
                { from: string; to: string },
                ProjectRow
            >(`
                SELECT DISTINCT project
                FROM heartbeats
                WHERE time > $from AND time < $to
                ORDER BY project
            `);

            const projects = query.all({
                from: range.from.toISOString(),
                to: range.to.toISOString(),
            });

            const wakapiProjects = projects.map((row) =>
                WakapiProject.create(row.project),
            );

            return Result.ok(wakapiProjects);
        } catch (error) {
            return Result.error(
                `Failed to get projects: ${
                    error instanceof Error ? error.message : String(error)
                }`,
            );
        }
    }

    getRecordsForProject<P extends InputProject = InputProject>(
        project: P,
        range: { from: Date; to: Date },
    ): Promise<Result<InputRecord<P>[]>> {
        try {
            const query = this._database.query<
                { projectName: string; from: string; to: string },
                TimeFrameRow
            >(`
                WITH
                    heartbeats_with_gap AS (
                        SELECT
                            *,
                            (
                                strftime('%s', time) - strftime(
                                    '%s',
                                    LAG(time) OVER (
                                        PARTITION BY
                                            project
                                        ORDER BY
                                            time
                                    )
                                )
                            ) AS gap,
                            LAG(project) OVER (
                                ORDER BY
                                    time
                            ) AS prev_project
                        FROM
                            heartbeats
                        WHERE
                            time > $from
                            AND time < $to
                            AND project = $projectName
                    ),
                    grouped_heartbeats AS (
                        SELECT
                            *,
                            SUM(
                                CASE
                                    WHEN gap > 900
                                    OR project <> prev_project THEN 1
                                    ELSE 0
                                END
                            ) OVER (
                                ORDER BY
                                    time
                            ) AS chunk_id
                        FROM
                            heartbeats_with_gap
                    )
                SELECT
                    chunk_id,
                    project,
                    MIN(time) AS start_time,
                    MAX(time) AS end_time
                FROM
                    grouped_heartbeats
                GROUP BY
                    chunk_id,
                    project
                ORDER BY
                    start_time
            `);

            const timeFrames = query.all({
                projectName: project.getUID(),
                from: range.from.toISOString(),
                to: range.to.toISOString(),
            });

            const records: InputRecord<P>[] = timeFrames.map((frame) => ({
                from: new Date(frame.start_time),
                to: new Date(frame.end_time),
                project,
            }));

            return Promise.resolve(Result.ok(records));
        } catch (error) {
            return Promise.resolve(
                Result.error(
                    `Failed to get records for project ${project.getUID()}: ${
                        error instanceof Error ? error.message : String(error)
                    }`,
                ),
            );
        }
    }
}
