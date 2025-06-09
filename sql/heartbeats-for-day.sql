-- database: ./wakapi.db
SELECT
    project,
    entity,
    datetime(time, 'localtime') as timestamp,
    created_at
FROM
    heartbeats
WHERE
    time > '2025-03-29'
    AND time < '2025-03-30'
ORDER BY
    time DESC
