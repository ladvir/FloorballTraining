using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FloorballTraining.Plugins.EFCoreSqlServer.Migrations
{
    // Converts a set of tags that duplicate an existing skill's meaning into that skill, on both
    // Activity (ActivityTag → ActivitySkill) and Training (TrainingTag → TrainingGoalSkill1/2/3).
    // Resolved BY NAME at execution time, never by hardcoded id — see #163 mapping table agreed
    // with the coach. Naturally idempotent: a second run finds no matching ActivityTag/TrainingTag
    // rows left (they were deleted the first time), so it's a no-op.
    /// <inheritdoc />
    public partial class MigrateTagsToSkills : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
DECLARE @Mapping TABLE (TagName NVARCHAR(200) COLLATE DATABASE_DEFAULT, SkillName NVARCHAR(200) COLLATE DATABASE_DEFAULT);
INSERT INTO @Mapping (TagName, SkillName) VALUES
    (N'Střelba', N'Střelba'),
    (N'Vedení míčku', N'Vedení míčku'),
    (N'Výbušnost', N'Výbušnost'),
    (N'Síla', N'Síla'),
    (N'Rychlost', N'Rychlost'),
    (N'Přihrávka', N'Přihrávka'),
    (N'Uvolňování', N'Uvolňování se pro přihrávku'),
    (N'Ohebnost', N'Flexibilita'),
    (N'Postřeh', N'Reakce'),
    (N'Herní myšlení', N'Čtení hry'),
    (N'Spolupráce v týmu', N'Komunikace se spoluhráči'),
    (N'Florbalový dribling', N'Kontrola míčku');

DECLARE @Resolved TABLE (TagId INT, SkillId INT);
INSERT INTO @Resolved (TagId, SkillId)
SELECT t.Id, s.Id
FROM @Mapping m
JOIN [Tags] t ON t.Name COLLATE DATABASE_DEFAULT = m.TagName
JOIN [Skills] s ON s.Name COLLATE DATABASE_DEFAULT = m.SkillName;

-- Activity side: every ActivityTag matching a mapped tag becomes an ActivitySkill instead.
INSERT INTO [ActivitySkill] ([ActivityId], [SkillId])
SELECT DISTINCT at.ActivityId, r.SkillId
FROM [ActivityTags] at
JOIN @Resolved r ON r.TagId = at.TagId
WHERE at.ActivityId IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM [ActivitySkill] x WHERE x.ActivityId = at.ActivityId AND x.SkillId = r.SkillId);

DELETE FROM [ActivityTags] WHERE TagId IN (SELECT TagId FROM @Resolved);

-- Training side: every TrainingTag matching a mapped tag fills the training's first free
-- TrainingGoalSkill slot (skipping if that skill is already one of its 3 slots), then the tag
-- link itself is removed — the skill replaces it as the training's stated focus.
DECLARE @trainingId INT, @skillId INT, @ttId INT;
DECLARE training_cursor CURSOR LOCAL FAST_FORWARD FOR
    SELECT tt.TrainingId, r.SkillId, tt.Id
    FROM [TrainingTag] tt
    JOIN @Resolved r ON r.TagId = tt.TagId
    WHERE tt.TrainingId IS NOT NULL
    ORDER BY tt.TrainingId, tt.Id;

OPEN training_cursor;
FETCH NEXT FROM training_cursor INTO @trainingId, @skillId, @ttId;
WHILE @@FETCH_STATUS = 0
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM [Trainings] tr
        WHERE tr.Id = @trainingId
          AND (tr.TrainingGoalSkill1Id = @skillId OR tr.TrainingGoalSkill2Id = @skillId OR tr.TrainingGoalSkill3Id = @skillId)
    )
    BEGIN
        UPDATE [Trainings] SET TrainingGoalSkill1Id = @skillId WHERE Id = @trainingId AND TrainingGoalSkill1Id IS NULL;
        IF @@ROWCOUNT = 0
            UPDATE [Trainings] SET TrainingGoalSkill2Id = @skillId WHERE Id = @trainingId AND TrainingGoalSkill2Id IS NULL;
        IF @@ROWCOUNT = 0
            UPDATE [Trainings] SET TrainingGoalSkill3Id = @skillId WHERE Id = @trainingId AND TrainingGoalSkill3Id IS NULL;
    END

    DELETE FROM [TrainingTag] WHERE Id = @ttId;

    FETCH NEXT FROM training_cursor INTO @trainingId, @skillId, @ttId;
END
CLOSE training_cursor;
DEALLOCATE training_cursor;

-- A training that used to be 'complete' purely on an untouched goal tag (not in the mapping
-- above — game formats, positions, 'Tělesná průprava'...) has no goal skill now and needs the
-- coach to pick one; reflect that honestly instead of leaving a stale IsDraft=0.
UPDATE [Trainings]
SET IsDraft = 1
WHERE IsDraft = 0
  AND TrainingGoalSkill1Id IS NULL AND TrainingGoalSkill2Id IS NULL AND TrainingGoalSkill3Id IS NULL
  AND NoSpecificGoal = 0;
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Best-effort only: re-creates the ActivityTag/TrainingTag links from the migrated
            // skills. Cannot tell which trainings were auto-flipped to draft above, so IsDraft is
            // left as-is, and any skill link added independently after Up() ran is also reversed
            // (there's no marker distinguishing "came from this migration" vs "added later").
            migrationBuilder.Sql(@"
DECLARE @Mapping TABLE (TagName NVARCHAR(200) COLLATE DATABASE_DEFAULT, SkillName NVARCHAR(200) COLLATE DATABASE_DEFAULT);
INSERT INTO @Mapping (TagName, SkillName) VALUES
    (N'Střelba', N'Střelba'),
    (N'Vedení míčku', N'Vedení míčku'),
    (N'Výbušnost', N'Výbušnost'),
    (N'Síla', N'Síla'),
    (N'Rychlost', N'Rychlost'),
    (N'Přihrávka', N'Přihrávka'),
    (N'Uvolňování', N'Uvolňování se pro přihrávku'),
    (N'Ohebnost', N'Flexibilita'),
    (N'Postřeh', N'Reakce'),
    (N'Herní myšlení', N'Čtení hry'),
    (N'Spolupráce v týmu', N'Komunikace se spoluhráči'),
    (N'Florbalový dribling', N'Kontrola míčku');

DECLARE @Resolved TABLE (TagId INT, SkillId INT);
INSERT INTO @Resolved (TagId, SkillId)
SELECT t.Id, s.Id
FROM @Mapping m
JOIN [Tags] t ON t.Name COLLATE DATABASE_DEFAULT = m.TagName
JOIN [Skills] s ON s.Name COLLATE DATABASE_DEFAULT = m.SkillName;

INSERT INTO [ActivityTags] ([ActivityId], [TagId])
SELECT DISTINCT ask.ActivityId, r.TagId
FROM [ActivitySkill] ask
JOIN @Resolved r ON r.SkillId = ask.SkillId
WHERE NOT EXISTS (SELECT 1 FROM [ActivityTags] x WHERE x.ActivityId = ask.ActivityId AND x.TagId = r.TagId);

INSERT INTO [TrainingTag] ([TrainingId], [TagId])
SELECT tr.Id, r.TagId
FROM [Trainings] tr
JOIN @Resolved r ON r.SkillId IN (tr.TrainingGoalSkill1Id, tr.TrainingGoalSkill2Id, tr.TrainingGoalSkill3Id)
WHERE NOT EXISTS (SELECT 1 FROM [TrainingTag] x WHERE x.TrainingId = tr.Id AND x.TagId = r.TagId);

UPDATE [Trainings] SET TrainingGoalSkill1Id = NULL WHERE TrainingGoalSkill1Id IN (SELECT SkillId FROM @Resolved);
UPDATE [Trainings] SET TrainingGoalSkill2Id = NULL WHERE TrainingGoalSkill2Id IN (SELECT SkillId FROM @Resolved);
UPDATE [Trainings] SET TrainingGoalSkill3Id = NULL WHERE TrainingGoalSkill3Id IN (SELECT SkillId FROM @Resolved);

DELETE FROM [ActivitySkill] WHERE SkillId IN (SELECT SkillId FROM @Resolved);
");
        }
    }
}
