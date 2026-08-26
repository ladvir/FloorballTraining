using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FloorballTraining.Plugins.EFCoreSqlServer.Migrations
{
    // Some conditioning skills (Síla, Rychlost, Koordinace, Výbušnost, Flexibilita) were split into
    // separate FieldPlayer/Goalkeeper rows even though they're role-agnostic. This moves them into
    // one shared "Kondice" (Position=Both) category, reassigning existing PlayerSkillRating /
    // MemberSkillFocus / TestDefinition history off the goalkeeper-side duplicates before deleting
    // them, so no rating history is lost. See #163 skill-catalog cleanup.
    //
    // Resolves every row BY NAME at execution time (never by hardcoded id) — dev and production
    // are separate databases whose auto-generated ids for the same seeded rows can differ.
    /// <inheritdoc />
    public partial class RestructureSharedConditioningSkills : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
DECLARE @fpKondiceId INT = (SELECT TOP 1 Id FROM [SkillCategories] WHERE [Name] = N'Kondice' AND [Position] = 0);
DECLARE @gkKondiceId INT = (SELECT TOP 1 Id FROM [SkillCategories] WHERE [Name] = N'Kondice' AND [Position] = 1);

IF @fpKondiceId IS NOT NULL AND @gkKondiceId IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM [SkillCategories] WHERE [Name] = N'Kondice' AND [Position] = 2)
BEGIN
    DECLARE @sharedKondiceId INT;

    INSERT INTO [SkillCategories] ([Name], [Position], [SortOrder])
    VALUES (N'Kondice', 2, 5);
    SET @sharedKondiceId = SCOPE_IDENTITY();

    -- Duplicated skills: field-player row survives (keeps its id), goalkeeper row's history is
    -- reassigned onto it, then the goalkeeper row is deleted. Resolved by name each time, not id.
    DECLARE @name NVARCHAR(100), @fpId INT, @gkId INT;
    DECLARE dup_cursor CURSOR LOCAL FAST_FORWARD FOR
        SELECT v.Name FROM (VALUES (N'Síla'), (N'Rychlost'), (N'Koordinace')) AS v(Name);
    OPEN dup_cursor;
    FETCH NEXT FROM dup_cursor INTO @name;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        SET @fpId = (SELECT TOP 1 Id FROM [Skills] WHERE [Name] = @name AND [SkillCategoryId] = @fpKondiceId);
        SET @gkId = (SELECT TOP 1 Id FROM [Skills] WHERE [Name] = @name AND [SkillCategoryId] = @gkKondiceId);

        IF @fpId IS NOT NULL
        BEGIN
            UPDATE [Skills] SET [SkillCategoryId] = @sharedKondiceId WHERE [Id] = @fpId;

            IF @gkId IS NOT NULL
            BEGIN
                UPDATE [PlayerSkillRatings] SET [SkillId] = @fpId WHERE [SkillId] = @gkId;
                UPDATE [MemberSkillFocuses] SET [SkillId] = @fpId WHERE [SkillId] = @gkId;
                UPDATE [TestDefinitions] SET [SkillId] = @fpId WHERE [SkillId] = @gkId;
                DELETE FROM [Skills] WHERE [Id] = @gkId;
            END
        END
        ELSE IF @gkId IS NOT NULL
        BEGIN
            -- No field-player duplicate found — just relocate the goalkeeper row as-is.
            UPDATE [Skills] SET [SkillCategoryId] = @sharedKondiceId WHERE [Id] = @gkId;
        END

        FETCH NEXT FROM dup_cursor INTO @name;
    END
    CLOSE dup_cursor;
    DEALLOCATE dup_cursor;

    -- Goalkeeper-only skills that are actually role-agnostic — no duplicate, just reclassify.
    UPDATE [Skills] SET [SkillCategoryId] = @sharedKondiceId
        WHERE [SkillCategoryId] = @gkKondiceId AND [Name] IN (N'Výbušnost', N'Flexibilita');

    -- Goalkeeper 'Kondice' is now empty if every one of its skills moved out above — safe to remove.
    IF NOT EXISTS (SELECT 1 FROM [Skills] WHERE [SkillCategoryId] = @gkKondiceId)
        DELETE FROM [SkillCategories] WHERE [Id] = @gkKondiceId;
END
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Best-effort only: recreates the goalkeeper "Kondice" category and moves the
            // still-identifiable (by name) skills back. Cannot restore the deleted duplicate skill
            // rows or split reassigned rating history back apart — that data is gone.
            migrationBuilder.Sql(@"
DECLARE @sharedId INT = (SELECT TOP 1 Id FROM [SkillCategories] WHERE [Name] = N'Kondice' AND [Position] = 2);
DECLARE @fpKondiceId INT = (SELECT TOP 1 Id FROM [SkillCategories] WHERE [Name] = N'Kondice' AND [Position] = 0);

IF @sharedId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM [SkillCategories] WHERE [Name] = N'Kondice' AND [Position] = 1)
BEGIN
    DECLARE @goalkeeperKondiceId INT;

    INSERT INTO [SkillCategories] ([Name], [Position], [SortOrder])
    VALUES (N'Kondice', 1, 5);
    SET @goalkeeperKondiceId = SCOPE_IDENTITY();

    UPDATE [Skills] SET [SkillCategoryId] = @goalkeeperKondiceId
        WHERE [SkillCategoryId] = @sharedId AND [Name] IN (N'Výbušnost', N'Flexibilita');

    IF @fpKondiceId IS NOT NULL
        UPDATE [Skills] SET [SkillCategoryId] = @fpKondiceId
            WHERE [SkillCategoryId] = @sharedId AND [Name] IN (N'Síla', N'Rychlost', N'Koordinace');

    IF NOT EXISTS (SELECT 1 FROM [Skills] WHERE [SkillCategoryId] = @sharedId)
        DELETE FROM [SkillCategories] WHERE [Id] = @sharedId;
END
");
        }
    }
}
