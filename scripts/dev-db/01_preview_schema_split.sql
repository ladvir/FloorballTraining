/*
================================================================================
  PREVIEW: schema split of the local dev database            (READ-ONLY, SAFE)
================================================================================
  Shows which tables live in [dbo] vs [flotr] and lists cross-schema foreign
  keys. Run this first to review what 02_move_flotr_to_dbo.sql will move.
  This script makes NO changes.
================================================================================
*/
SET NOCOUNT ON;

PRINT '== Table count per schema ==';
SELECT s.name AS [schema], COUNT(*) AS table_count
FROM sys.tables t
JOIN sys.schemas s ON t.schema_id = s.schema_id
GROUP BY s.name
ORDER BY s.name;

PRINT '== Tables currently in [flotr] (these would move to [dbo]) ==';
SELECT t.name AS table_name
FROM sys.tables t
WHERE t.schema_id = SCHEMA_ID('flotr')
ORDER BY t.name;

PRINT '== Cross-schema foreign keys (informational; TRANSFER keeps them intact) ==';
SELECT ps.name + '.' + pt.name AS parent_table,
       rs.name + '.' + rt.name AS referenced_table,
       fk.name                 AS fk_name
FROM sys.foreign_keys fk
JOIN sys.tables  pt ON fk.parent_object_id     = pt.object_id
JOIN sys.schemas ps ON pt.schema_id            = ps.schema_id
JOIN sys.tables  rt ON fk.referenced_object_id = rt.object_id
JOIN sys.schemas rs ON rt.schema_id            = rs.schema_id
WHERE ps.name <> rs.name
ORDER BY parent_table;

PRINT '== Name collisions (same table name in BOTH schemas -> would block move) ==';
SELECT f.name AS table_name
FROM sys.tables f
WHERE f.schema_id = SCHEMA_ID('flotr')
  AND EXISTS (SELECT 1 FROM sys.tables d
              WHERE d.schema_id = SCHEMA_ID('dbo') AND d.name = f.name);
