/*
================================================================================
  MOVE ALL [flotr] TABLES TO [dbo]                              -- DEV ONLY --
================================================================================
  WHY
    This LOCAL DEV database keeps 34 tables (including every ASP.NET Identity
    AspNet* table) under the [flotr] schema. EF Core emits UNQUALIFIED table
    names, which resolve to the connecting login's default schema -- [dbo] for
    the Integrated-Security dev login. Result on dev only:
      * Identity/EF calls fail with error 208 "invalid object name"
      * migrations whose FK references AspNetUsers fail with error 1767
    Moving the tables into [dbo] makes the dev login resolve them correctly.

  WHAT
    Transfers every table currently in [flotr] to [dbo]. Foreign keys, indexes,
    defaults and triggers move WITH the table (ALTER SCHEMA ... TRANSFER is
    object-id based), so nothing has to be dropped or recreated. Cross-schema
    FKs simply become same-schema FKs.

  PRODUCTION
    *** DO NOT RUN ON PRODUCTION. Production must stay in the [flotr] schema. ***
    The guard below aborts unless the server is a SQL LocalDB instance
    (@@SERVERNAME contains 'LOCALDB#'); production servers are not LocalDB.

  NOTES
    * The [flotr] SCHEMA is intentionally NOT dropped -- a database user named
      'flotr' uses it as its default schema. It is just left empty.
    * Runs in a single transaction; any error rolls the whole thing back.

  AFTER RUNNING
    Run:  dotnet ef database update
          --project FloorballTraining.Plugins.EFCoreSqlServer
          --startup-project FloorballTraining.API
    to create [dbo].RefreshTokens (and any future pending migrations).

  ROLLBACK
    scripts/dev-db/03_rollback_dbo_to_flotr.sql
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
    PRINT 'Nothing to do: schema [flotr] does not exist.';
    RETURN;
END

BEGIN TRY
    BEGIN TRAN;

    DECLARE @name sysname, @sql nvarchar(max), @moved int = 0, @skipped int = 0;

    DECLARE move_cur CURSOR LOCAL FAST_FORWARD FOR
        SELECT t.name
        FROM sys.tables t
        WHERE t.schema_id = SCHEMA_ID('flotr')
        ORDER BY t.name;

    OPEN move_cur;
    FETCH NEXT FROM move_cur INTO @name;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        IF OBJECT_ID(N'dbo.' + QUOTENAME(@name)) IS NOT NULL
        BEGIN
            PRINT 'SKIP  (already exists in dbo): ' + @name;
            SET @skipped += 1;
        END
        ELSE
        BEGIN
            SET @sql = N'ALTER SCHEMA dbo TRANSFER flotr.' + QUOTENAME(@name) + N';';
            EXEC sys.sp_executesql @sql;
            PRINT 'MOVED flotr -> dbo : ' + @name;
            SET @moved += 1;
        END
        FETCH NEXT FROM move_cur INTO @name;
    END
    CLOSE move_cur;
    DEALLOCATE move_cur;

    PRINT '----------------------------------------';
    PRINT 'Moved:   ' + CAST(@moved AS varchar(10));
    PRINT 'Skipped: ' + CAST(@skipped AS varchar(10));

    COMMIT;
    PRINT 'DONE. Now run: dotnet ef database update';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK;
    IF CURSOR_STATUS('local', 'move_cur') >= 0
    BEGIN
        CLOSE move_cur;
        DEALLOCATE move_cur;
    END
    PRINT 'ERROR -- rolled back, no changes made.';
    THROW;
END CATCH

-- Verification
PRINT '== Table count per schema (after) ==';
SELECT s.name AS [schema], COUNT(*) AS table_count
FROM sys.tables t
JOIN sys.schemas s ON t.schema_id = s.schema_id
GROUP BY s.name
ORDER BY s.name;
