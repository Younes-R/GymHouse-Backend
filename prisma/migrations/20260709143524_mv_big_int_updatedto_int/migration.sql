-- 1st MATERIALIZED VIEW
DROP MATERIALIZED VIEW IF EXISTS mv_demographic_age_groups;

CREATE MATERIALIZED VIEW mv_demographic_age_groups AS
SELECT
    CASE 
        WHEN EXTRACT(YEAR FROM AGE("birthDate")) < 18 THEN 'Under 18'
        WHEN EXTRACT(YEAR FROM AGE("birthDate")) BETWEEN 18 AND 25 THEN '18-25'
        WHEN EXTRACT(YEAR FROM AGE("birthDate")) BETWEEN 26 AND 35 THEN '26-35'
        WHEN EXTRACT(YEAR FROM AGE("birthDate")) BETWEEN 36 AND 50 THEN '36-50'
        ELSE '51+'
    END AS "ageGroup",
    "gender",
    COUNT(*)::INT AS "totalMembers"
FROM "User"
GROUP BY "ageGroup", "gender"
ORDER BY "ageGroup";

-- 2nd MATERIALIZED VIEW
DROP MATERIALIZED VIEW IF EXISTS mv_peak_attendance_hours;
CREATE MATERIALIZED VIEW mv_peak_attendance_hours AS
SELECT
    EXTRACT(HOUR FROM a."startedAt") AS "attendanceHour",
    u."gender",
    COUNT(*)::INT AS "totalCheckIns"
FROM "Attendance" a
JOIN "User" u ON a."userId" = u."userId"
WHERE a."startedAt" >= NOW() - INTERVAL '30 days'
GROUP BY "attendanceHour", u."gender"
ORDER BY "attendanceHour";

