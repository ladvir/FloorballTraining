-- Unify column collations to the database default (SQL_Latin1_General_CP1_CI_AS).
--
-- Background: some production columns (e.g. Members.FirstName/LastName/Email)
-- were created with a different collation (Czech_CI_AS) than the database
-- default and string literals (SQL_Latin1_General_CP1_CI_AS). Mixing them in a
-- SQL expression (e.g. FirstName + ' ' + LastName) throws
-- "Cannot resolve collation conflict ... in add operator".
--
-- This script is dynamic and idempotent: it only touches char-based, non-Identity,
-- non-computed columns whose collation differs from the target. Dependent
-- non-clustered indexes are dropped and recreated around the ALTER COLUMN.
-- If a target column participates in a primary key, unique constraint or
-- clustered index, the script aborts so it can be handled manually.
--
-- NOTE: relies on the surrounding transaction (EF migration wraps this).
--       When running standalone, wrap in BEGIN TRAN / COMMIT yourself.

SET NOCOUNT ON;

DECLARE @target sysname = N'SQL_Latin1_General_CP1_CI_AS';

-- 1) Columns to normalize.
DECLARE @cols TABLE (
    SchemaName sysname, TableName sysname, ColumnName sysname,
    TypeName sysname, max_length int, is_nullable bit,
    object_id int, column_id int
);

INSERT INTO @cols (SchemaName, TableName, ColumnName, TypeName, max_length, is_nullable, object_id, column_id)
SELECT s.name, t.name, c.name, ty.name, c.max_length, c.is_nullable, c.object_id, c.column_id
FROM sys.columns c
JOIN sys.tables t   ON c.object_id = t.object_id
JOIN sys.schemas s  ON t.schema_id = s.schema_id
JOIN sys.types ty   ON c.user_type_id = ty.user_type_id
WHERE c.collation_name IS NOT NULL
  AND c.collation_name <> @target
  AND c.is_computed = 0
  AND ty.name IN ('char', 'varchar', 'nchar', 'nvarchar')
  AND t.name NOT LIKE 'AspNet%';

IF NOT EXISTS (SELECT 1 FROM @cols)
    RETURN;  -- nothing to do

-- 2) Safety guard: refuse to touch columns inside a PK, unique constraint or clustered index.
IF EXISTS (
    SELECT 1
    FROM @cols c
    JOIN sys.index_columns ic ON ic.object_id = c.object_id AND ic.column_id = c.column_id
    JOIN sys.indexes i        ON i.object_id = ic.object_id AND i.index_id = ic.index_id
    WHERE i.is_primary_key = 1 OR i.is_unique_constraint = 1 OR i.type = 1 /* clustered */
)
BEGIN
    RAISERROR(N'UnifyCollation: a target column participates in a primary key, unique constraint or clustered index. Handle these manually.', 16, 1);
    RETURN;
END

-- 3) Script DROP + CREATE for non-clustered indexes that reference target columns.
DECLARE @dropSql nvarchar(max) = N'';
DECLARE @createSql nvarchar(max) = N'';

;WITH idx AS (
    SELECT DISTINCT i.object_id, i.index_id
    FROM sys.indexes i
    JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
    JOIN @cols c ON c.object_id = i.object_id AND c.column_id = ic.column_id
    WHERE i.type = 2 AND i.is_primary_key = 0 AND i.is_unique_constraint = 0
)
SELECT
    @dropSql = @dropSql
        + N'DROP INDEX ' + QUOTENAME(i.name) + N' ON '
        + QUOTENAME(s.name) + N'.' + QUOTENAME(t.name) + N';' + CHAR(10),
    @createSql = @createSql
        + N'CREATE ' + CASE WHEN i.is_unique = 1 THEN N'UNIQUE ' ELSE N'' END
        + N'NONCLUSTERED INDEX ' + QUOTENAME(i.name) + N' ON '
        + QUOTENAME(s.name) + N'.' + QUOTENAME(t.name) + N' ('
        + STUFF((SELECT N', ' + QUOTENAME(col.name) + CASE WHEN ic.is_descending_key = 1 THEN N' DESC' ELSE N' ASC' END
                 FROM sys.index_columns ic
                 JOIN sys.columns col ON col.object_id = ic.object_id AND col.column_id = ic.column_id
                 WHERE ic.object_id = i.object_id AND ic.index_id = i.index_id AND ic.is_included_column = 0
                 ORDER BY ic.key_ordinal
                 FOR XML PATH(''), TYPE).value('.', 'nvarchar(max)'), 1, 2, N'') + N')'
        + ISNULL(N' INCLUDE (' + NULLIF(STUFF((SELECT N', ' + QUOTENAME(col.name)
                 FROM sys.index_columns ic
                 JOIN sys.columns col ON col.object_id = ic.object_id AND col.column_id = ic.column_id
                 WHERE ic.object_id = i.object_id AND ic.index_id = i.index_id AND ic.is_included_column = 1
                 ORDER BY ic.index_column_id
                 FOR XML PATH(''), TYPE).value('.', 'nvarchar(max)'), 1, 2, N''), N'') + N')', N'')
        + ISNULL(N' WHERE ' + i.filter_definition, N'')
        + N';' + CHAR(10)
FROM idx
JOIN sys.indexes i ON i.object_id = idx.object_id AND i.index_id = idx.index_id
JOIN sys.tables t  ON i.object_id = t.object_id
JOIN sys.schemas s ON t.schema_id = s.schema_id;

IF @dropSql <> N'' EXEC sys.sp_executesql @dropSql;

-- 4) Alter each target column to the target collation, preserving type/length/nullability.
DECLARE @alterSql nvarchar(max) = N'';
SELECT @alterSql = @alterSql
    + N'ALTER TABLE ' + QUOTENAME(SchemaName) + N'.' + QUOTENAME(TableName)
    + N' ALTER COLUMN ' + QUOTENAME(ColumnName) + N' ' + TypeName
    + CASE
        WHEN TypeName IN ('nchar', 'nvarchar')
            THEN N'(' + CASE WHEN max_length = -1 THEN N'max' ELSE CAST(max_length / 2 AS nvarchar(10)) END + N')'
        WHEN TypeName IN ('char', 'varchar')
            THEN N'(' + CASE WHEN max_length = -1 THEN N'max' ELSE CAST(max_length AS nvarchar(10)) END + N')'
        ELSE N''
      END
    + N' COLLATE ' + @target
    + CASE WHEN is_nullable = 1 THEN N' NULL' ELSE N' NOT NULL' END
    + N';' + CHAR(10)
FROM @cols;

EXEC sys.sp_executesql @alterSql;

-- 5) Recreate the dropped indexes.
IF @createSql <> N'' EXEC sys.sp_executesql @createSql;
