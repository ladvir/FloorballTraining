using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FloorballTraining.Plugins.EFCoreSqlServer.Migrations
{
    // Follow-up to #163's RestructureSharedConditioningSkills: that migration already merged the
    // duplicated Síla/Rychlost/Koordinace/Výbušnost/Flexibilita rows into one shared "Kondice"
    // (Position=Both) category, but left the field-player-only "Kondice" row (and whatever skills
    // still lived under it, e.g. Akcelerace/Vytrvalost/Obratnost) untouched. User feedback
    // 2026-08-26: those are role-agnostic too (a goalkeeper needs acceleration/endurance/agility
    // just as much) - finish the consolidation into a single "Kondice" category for both roles.
    //
    // Unlike the #163 migration, the set of remaining field-player skills is discovered at
    // execution time (not a hardcoded name list) - dev/prod may not have identical residual
    // skills under the field-player row. Resolves categories/skills BY NAME, never by hardcoded id.
    /// <inheritdoc />
    public partial class MergeConditioningSkillCategories : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
DECLARE @fpKondiceId INT = (SELECT TOP 1 Id FROM [SkillCategories] WHERE [Name] = N'Kondice' AND [Position] = 0);
DECLARE @sharedKondiceId INT = (SELECT TOP 1 Id FROM [SkillCategories] WHERE [Name] = N'Kondice' AND [Position] = 2);

IF @fpKondiceId IS NOT NULL AND @sharedKondiceId IS NOT NULL AND @fpKondiceId <> @sharedKondiceId
BEGIN
    DECLARE @name NVARCHAR(100), @fpId INT, @sharedDupId INT;
    DECLARE fp_cursor CURSOR LOCAL FAST_FORWARD FOR
        SELECT [Name], [Id] FROM [Skills] WHERE [SkillCategoryId] = @fpKondiceId;
    OPEN fp_cursor;
    FETCH NEXT FROM fp_cursor INTO @name, @fpId;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        SET @sharedDupId = (SELECT TOP 1 Id FROM [Skills] WHERE [Name] = @name AND [SkillCategoryId] = @sharedKondiceId);

        IF @sharedDupId IS NOT NULL
        BEGIN
            -- Same-named skill already lives in the shared category - reassign every reference
            -- onto it (all FKs to Skills as of this migration) and drop the field-player duplicate.
            UPDATE [PlayerSkillRatings] SET [SkillId] = @sharedDupId WHERE [SkillId] = @fpId;
            UPDATE [MemberSkillFocuses] SET [SkillId] = @sharedDupId WHERE [SkillId] = @fpId;
            UPDATE [TestDefinitions] SET [SkillId] = @sharedDupId WHERE [SkillId] = @fpId;
            UPDATE [ActivitySkill] SET [SkillId] = @sharedDupId WHERE [SkillId] = @fpId;
            UPDATE [Trainings] SET [TrainingGoalSkill1Id] = @sharedDupId WHERE [TrainingGoalSkill1Id] = @fpId;
            UPDATE [Trainings] SET [TrainingGoalSkill2Id] = @sharedDupId WHERE [TrainingGoalSkill2Id] = @fpId;
            UPDATE [Trainings] SET [TrainingGoalSkill3Id] = @sharedDupId WHERE [TrainingGoalSkill3Id] = @fpId;
            DELETE FROM [Skills] WHERE [Id] = @fpId;
        END
        ELSE
        BEGIN
            -- No name collision - just relocate the skill into the shared category as-is.
            UPDATE [Skills] SET [SkillCategoryId] = @sharedKondiceId WHERE [Id] = @fpId;
        END

        FETCH NEXT FROM fp_cursor INTO @name, @fpId;
    END
    CLOSE fp_cursor;
    DEALLOCATE fp_cursor;

    -- Field-player 'Kondice' is now empty - safe to remove.
    IF NOT EXISTS (SELECT 1 FROM [Skills] WHERE [SkillCategoryId] = @fpKondiceId)
        DELETE FROM [SkillCategories] WHERE [Id] = @fpKondiceId;
END
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Best-effort only, same caveat as #163's RestructureSharedConditioningSkills Down:
            // recreates the field-player "Kondice" category and moves the still-identifiable (by
            // name) skills back, using the exact 3 names known to be field-player-only at the time
            // this migration was written. Cannot recover skills merged via the duplicate-name
            // branch above, or re-split reassigned rating/goal/activity history - that data is gone.
            migrationBuilder.Sql(@"
DECLARE @sharedId INT = (SELECT TOP 1 Id FROM [SkillCategories] WHERE [Name] = N'Kondice' AND [Position] = 2);

IF @sharedId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM [SkillCategories] WHERE [Name] = N'Kondice' AND [Position] = 0)
BEGIN
    DECLARE @fpKondiceId INT;

    INSERT INTO [SkillCategories] ([Name], [Position], [SortOrder])
    VALUES (N'Kondice', 0, 6);
    SET @fpKondiceId = SCOPE_IDENTITY();

    UPDATE [Skills] SET [SkillCategoryId] = @fpKondiceId
        WHERE [SkillCategoryId] = @sharedId AND [Name] IN (N'Akcelerace', N'Vytrvalost', N'Obratnost');

    IF NOT EXISTS (SELECT 1 FROM [Skills] WHERE [SkillCategoryId] = @fpKondiceId)
        DELETE FROM [SkillCategories] WHERE [Id] = @fpKondiceId;
END
");
        }
    }
}
