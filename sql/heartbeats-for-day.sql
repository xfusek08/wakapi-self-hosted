-- database: ../data/wakapi.db

SELECT
    project,
    datetime(time, 'localtime') as timestamp,
    entity,
    created_at
FROM
    heartbeats
WHERE
    time > '2025-06-24'
    AND time < '2025-06-25'
ORDER BY
    time ASC
