/*
================================================================================
  ROLLBACK: move the originally-[flotr] tables back to [flotr]   -- DEV ONLY --
================================================================================
  Reverses 02_move_flotr_to_dbo.sql by transferring the SPECIFIC 34 tables that
  were in [flotr] (captured at the time the move script was written) back to
  [flotr]. Tables that were always in [dbo] (e.g. Trainings, Activities) and the
  newly created [dbo].RefreshTokens are left untouched.

  *** DEV ONLY. Guarded to SQL LocalDB. DO NOT RUN ON PRODUCTION. ***
================================================================================
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;

IF @@SERVERNAME NOT LIKE '%LOCALDB#%'
BEGIN
    RAISERROR('ABORTED: not a SQL LocalDB instance. This script is DEV ONLY and must never run on production.', 16, 1);
    RETURN;
END

IF SCHEMA_ID('flotr') IS NULL
BEGIN
    RAISERROR('ABORTED: schema [flotr] does not exist.', 16, 1);
    RETURN;
END

DECLARE @originalFlotr TABLE (name sysname PRIMARY KEY);
INSERT INTO @originalFlotr (name) VALUES
    ('AppointmentRatings'),
    ('AppointmentTestDefinitions'),
    ('AspNetRoleClaims'),
    ('AspNetRoles'),
    ('AspNetUserClaims'),
    ('AspNetUserLogins'),
    ('AspNetUserRoles'),
    ('AspNetUsers'),
    ('AspNetUserTokens'),
    ('AuctionItems'),
    ('Bids'),
    ('FormationTemplates'),
    ('FormationTemplateSlots'),
    ('GradeOptions'),
    ('LineupFormations'),
    ('LineupRosters'),
    ('LineupSlots'),
    ('MatchLineups'),
    ('Notifications'),
    ('RoleRequests'),
    ('Seasons'),
    ('StatTrackerEntries'),
    ('StatTrackerMetrics'),
    ('StatTrackerParticipants'),
    ('StatTrackers'),
    ('TeamStatMetricTemplates'),
    ('TestColourRanges'),
    ('TestDefinitions'),
    ('TestResults'),
    ('TournamentMatches'),
    ('TournamentMatchTaskCompletions'),
    ('Tournaments'),
    ('TournamentSpecialTasks'),
    ('TournamentTeams');

BEGIN TRY
    BEGIN TRAN;

    DECLARE @name sysname, @sql nvarchar(max), @moved int = 0, @skipped int = 0;

    DECLARE rb_cur CURSOR LOCAL FAST_FORWARD FOR
        SELECT name FROM @originalFlotr ORDER BY name;

    OPEN rb_cur;
    FETCH NEXT FROM rb_cur INTO @name;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        IF OBJECT_ID(N'dbo.' + QUOTENAME(@name)) IS NOT NULL
        BEGIN
            SET @sql = N'ALTER SCHEMA flotr TRANSFER dbo.' + QUOTENAME(@name) + N';';
            EXEC sys.sp_executesql @sql;
            PRINT 'MOVED dbo -> flotr : ' + @name;
            SET @moved += 1;
        END
        ELSE
        BEGIN
            PRINT 'SKIP  (not found in dbo): ' + @name;
            SET @skipped += 1;
        END
        FETCH NEXT FROM rb_cur INTO @name;
    END
    CLOSE rb_cur;
    DEALLOCATE rb_cur;

    PRINT '----------------------------------------';
    PRINT 'Moved back: ' + CAST(@moved AS varchar(10));
    PRINT 'Skipped:    ' + CAST(@skipped AS varchar(10));

    COMMIT;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK;
    IF CURSOR_STATUS('local', 'rb_cur') >= 0
    BEGIN
        CLOSE rb_cur;
        DEALLOCATE rb_cur;
    END
    PRINT 'ERROR -- rolled back, no changes made.';
    THROW;
END CATCH

PRINT '== Table count per schema (after rollback) ==';
SELECT s.name AS [schema], COUNT(*) AS table_count
FROM sys.tables t
JOIN sys.schemas s ON t.schema_id = s.schema_id
GROUP BY s.name
ORDER BY s.name;
