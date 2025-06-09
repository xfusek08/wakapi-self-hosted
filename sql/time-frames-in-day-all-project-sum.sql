-- database: ./wakapi.db
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
            time > '2025-06-05'
            AND time < '2025-06-06'
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
SELECT
    project,
    SUM(
        strftime('%s', datetime(end_time, 'localtime')) - strftime('%s', datetime(start_time, 'localtime'))
    ) AS total_seconds,
    (SUM(strftime('%s', datetime(end_time, 'localtime')) - strftime('%s', datetime(start_time, 'localtime'))) / 3600) || 'h ' ||
    ((SUM(strftime('%s', datetime(end_time, 'localtime')) - strftime('%s', datetime(start_time, 'localtime'))) % 3600) / 60) || 'm ' ||
    (SUM(strftime('%s', datetime(end_time, 'localtime')) - strftime('%s', datetime(start_time, 'localtime'))) % 60) || 's' AS formatted_time
FROM
    chunk_data
GROUP BY
    project
ORDER BY
    total_seconds DESC;