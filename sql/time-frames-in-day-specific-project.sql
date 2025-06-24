-- database: ../data/wakapi.db

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
            time > '2025-06-12'
            AND time < '2025-06-13'
            -- AND project = 'tikitio'
            -- AND project = 'selektor-detailu'
            AND project = 'MBO Optia'
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
    MIN(datetime(time, 'localtime')) AS start_time,
    MAX(datetime(time, 'localtime')) AS end_time,
    ((strftime('%s', MAX(time)) - strftime('%s', MIN(time))) / 3600) || 'h ' ||
    (((strftime('%s', MAX(time)) - strftime('%s', MIN(time))) % 3600) / 60) || 'm ' ||
    ((strftime('%s', MAX(time)) - strftime('%s', MIN(time))) % 60) || 's' AS duration
FROM
    grouped_heartbeats
GROUP BY
    chunk_id,
    project
ORDER BY
    start_time;
