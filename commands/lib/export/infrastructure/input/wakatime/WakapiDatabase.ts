import { Database } from 'bun:sqlite';

import { RepositoryQuery } from '../../../domain/common/ports/RepositoryQuery';
import TimeRange from '../../../domain/common/ports/TimeRange';
import TimeRecord from '../../../domain/common/ports/TimeRecord';
import { Result } from '../../../domain/utils/type-utils';
import WakapiProject from './WakapiProject';
import WakapiTimeRecord from './WakapiTimeRecord';

export class WakapiDatabase implements RepositoryQuery<WakapiProject> {
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

    public async getProjects(
        timeRange: TimeRange,
    ): Promise<Result<WakapiProject[]>> {
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
                            datetime(MIN(time), 'localtime') AS start_time,
                            datetime(MAX(time), 'localtime') AS end_time
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

            const params = {
                from: this.dateToParamString(timeRange.from),
                to: this.dateToParamString(timeRange.to),
            };

            const rows = query.all(params);

            console.log(rows);

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

    public getRecordsForProject({
        project,
        timeRange,
    }: {
        project: WakapiProject;
        timeRange: TimeRange;
    }): Promise<Result<TimeRecord[]>> {
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
                    datetime(MIN(time), 'localtime') AS start_time,
                    datetime(MAX(time), 'localtime') AS end_time
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
                from: this.dateToParamString(timeRange.from),
                to: this.dateToParamString(timeRange.to),
                project: project.name,
            });

            console.log('');
            console.log(`Records for project ${project.name}:`);
            console.log(rows);
            console.log('');

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
