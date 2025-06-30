import { Database } from 'bun:sqlite';
import { isNotNil } from 'bunner/framework';

import { RepositoryQuery } from '../../../domain/common/ports/RepositoryQuery';
import TimeEntry from '../../../domain/common/ports/TimeEntry';
import TimeRange from '../../../domain/common/utility-classes/TimeRange';
import { Result } from '../../../domain/common/utility-types/Result';
import WakapiProject from './WakapiProject';
import WakapiTimeEntry from './WakapiTimeRecord';

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

    public async getTimeEntries(
        timeRange: TimeRange,
    ): Promise<Result<TimeEntry<WakapiProject>[]>> {
        return Result.ensure(async () => {
            const projects = this.getProjects(timeRange);
            const allTimeEntries: WakapiTimeEntry[] = [];

            for (const project of projects) {
                const projectEntries = this.getRecordsForProject({
                    project,
                    timeRange,
                });
                allTimeEntries.push(...projectEntries);
            }

            return allTimeEntries;
        });
    }

    private getProjects(timeRange: TimeRange): WakapiProject[] {
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

        return rows
            .map((row) => WakapiProject.parse(row).assert())
            .filter(isNotNil);
    }

    private getRecordsForProject({
        project,
        timeRange,
    }: {
        project: WakapiProject;
        timeRange: TimeRange;
    }): WakapiTimeEntry[] {
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

        const parsed = rows.map((row) => WakapiTimeEntry.parse(row).assert());

        return parsed;
    }

    private dateToParamString(date: Date): string {
        return date.toISOString().slice(0, 19).replace('T', ' ');
    }
}
