# Dev DB schema fix — move `flotr` tables to `dbo`

**Scope: local development database only. Production is intentionally left in the `flotr` schema and these scripts must never run against it.**

## Background

The local dev database `(localdb)\MSSQLLocalDB` → `FloorballTraining` has its tables
split across two schemas:

- `dbo` — older tables (Trainings, Activities, Tags, Clubs, Teams, …)
- `flotr` — 34 newer tables, **including all ASP.NET Identity `AspNet*` tables**

EF Core emits **unqualified** table names (`SELECT … FROM [AspNetUsers]`), which SQL
Server resolves against the connecting login's **default schema**. The dev app
connects with Integrated Security (a Windows login whose default schema is `dbo`),
so the 34 `flotr` tables are invisible to it. Symptoms (dev only):

- Identity / EF calls fail with **error 208** "invalid object name"
- migrations whose FK references `AspNetUsers` fail with **error 1767**
  ("references invalid table 'AspNetUsers'")

Production connects with a principal whose default schema is `flotr`, so there it
works as-is and must stay that way.

## Why this does not affect production

These are standalone SQL maintenance scripts. They **do not** touch the EF model,
migrations, connection strings, or any committed code — nothing that ships to
production changes. Each script also has a hard guard that aborts unless the server
is a SQL LocalDB instance (`@@SERVERNAME LIKE '%LOCALDB#%'`), and production is not
LocalDB.

## Usage

Run in order against the dev DB:

```powershell
# 1. Review what will move (read-only, safe)
sqlcmd -S "(localdb)\MSSQLLocalDB" -d FloorballTraining -i scripts/dev-db/01_preview_schema_split.sql

# 2. Move every flotr table to dbo (transactional)
sqlcmd -S "(localdb)\MSSQLLocalDB" -d FloorballTraining -i scripts/dev-db/02_move_flotr_to_dbo.sql

# 3. Create the RefreshTokens table (and any pending migrations)
dotnet ef database update --project FloorballTraining.Plugins.EFCoreSqlServer --startup-project FloorballTraining.API
```

To revert the move (restores the original `flotr` split; leaves `dbo.RefreshTokens`):

```powershell
sqlcmd -S "(localdb)\MSSQLLocalDB" -d FloorballTraining -i scripts/dev-db/03_rollback_dbo_to_flotr.sql
```

## Notes

- Foreign keys and indexes move **with** their tables (`ALTER SCHEMA … TRANSFER`
  is object-id based) — no FK is dropped or recreated.
- The `flotr` **schema** is not dropped: a database user named `flotr` uses it as
  its default schema. After the move it is simply empty.
- Both move and rollback run inside a single transaction and roll back on error.
