import { Database } from 'bun:sqlite';
import { InputRepositoryQuery } from '../../../domain/input/ports/InputRepositoryQuery';
import { Result } from '../../../domain/utils/type-utils';
import WakapiProject from './WakapiProject';
import TimeRecord from '../../../domain/common/ports/TimeRecord';
import WakapiTimeRecord from './WakapiTimeRecord';

interface ProjectRow {
    project: string;
}

interface TimeFrameRow {
    chunk_id: number;
    project: string;
    start_time: string;
    end_time: string;
}

export class WakapiDatabase implements InputRepositoryQuery<WakapiProject> {
    private constructor(private readonly _database: Database) {}

    static create({
        wakapiDbPath,
    }: {
        wakapiDbPath: string;
    }): Result<WakapiDatabase> {
        try {
            const db = new Database(wakapiDbPath, {
                readonly: true,
                strict: true,
            });
            return Result.ok(new WakapiDatabase(db));
        } catch (error) {
            return Result.error(error);
        }
    }

    public async getProjects(range: {
        from: Date;
        to: Date;
    }): Promise<Result<WakapiProject[]>> {
        try {
            const sql = `
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
                    ),
                    chunk_data AS (
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
                    )
                SELECT DISTINCT
                    project
                FROM
                    chunk_data
                ORDER BY
                    project
            `;

            const query = this._database.query(sql);
            const rows = query.all({
                from: this.dateToParamString(range.from),
                to: this.dateToParamString(range.to),
            });

            const projects = rows.map((row) =>
                WakapiProject.parse(row).assert(),
            );

            return Result.ok(projects);
        } catch (error) {
            return Result.error(
                `Failed to get projects: ${
                    error instanceof Error ? error.message : String(error)
                }`,
            );
        }
    }

    public getRecordsForProject(
        project: WakapiProject,
        range: { from: Date; to: Date },
    ): Promise<Result<TimeRecord[]>> {
        return Result.ensure(async () => {
            const sql = `
                WITH
                    heartbeats_with_gap AS (
                        SELECT
                            *,
                            (
                                strftime('%s', time) - strftime(
                                    '%s',
                                    LAG(time) OVER (
                                        ORDER BY
                                            time
                                    )
                                )
                            ) AS gap
                        FROM
                            heartbeats
                        WHERE
                            time > $from
                            AND time < $to
                            AND project = $project
                    ),
                    grouped_heartbeats AS (
                        SELECT
                            *,
                            SUM(
                                CASE
                                    WHEN gap > 900 THEN 1
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
            `;

            const statement = this._database.query(sql);
            const rows = statement.all({
                from: this.dateToParamString(range.from),
                to: this.dateToParamString(range.to),
                project: project.name,
            });

            const parsed = rows.map((row) =>
                WakapiTimeRecord.parse(row).assert(),
            );

            return Result.ok(parsed);
        });
    }

    private dateToParamString(date: Date): string {
        return date.toISOString().slice(0, 19).replace('T', ' ');
    }
}
