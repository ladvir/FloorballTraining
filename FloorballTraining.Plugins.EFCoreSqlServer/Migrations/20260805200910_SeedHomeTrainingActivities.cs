using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FloorballTraining.Plugins.EFCoreSqlServer.Migrations
{
    /// <inheritdoc />
    public partial class SeedHomeTrainingActivities : Migration
    {
        // The seeded home trainings (20260803065626_SeedHomeTrainings) were empty shells: no goal,
        // no training part, no activity — so TrainingValidator marks them draft and they vanish from
        // the individual-training picker (IsIndividual && !IsDraft). This turns each one into a VALID
        // training: give it a focus (goal), one activity (5–15 min) carrying that focus, and one
        // training part that holds the activity and covers the whole training duration.
        private const string SeedMarker = "seed:home-training";

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql($@"
IF NOT EXISTS (SELECT 1 FROM [Activities] WHERE [CreatedByUserId] = N'{SeedMarker}')
BEGIN
    -- 1) Focus per training (required by TrainingValidator). ponytail: keyword heuristic on the
    --    drill name; only refine to per-training goals if a coach reports a wrong label.
    UPDATE t SET t.[TrainingGoal1Id] =
        CASE
            WHEN t.[Name] LIKE N'%střel%' OR t.[Name] LIKE N'%zakonč%' THEN 29 -- Střelba
            WHEN t.[Name] LIKE N'%přihráv%' OR t.[Name] LIKE N'%o zeď%' OR t.[Name] LIKE N'%one-touch%' THEN 30 -- Přihrávka
            WHEN t.[Name] LIKE N'%sprint%' OR t.[Name] LIKE N'%rychlé nohy%' OR t.[Name] LIKE N'%vysoká kolena%'
                 OR t.[Name] LIKE N'%přeskok%' OR t.[Name] LIKE N'%agility%' OR t.[Name] LIKE N'%skoky%'
                 OR t.[Name] LIKE N'%reakč%' THEN 36 -- Rychlost
            WHEN t.[Name] LIKE N'%dřep%' OR t.[Name] LIKE N'%výpad%' OR t.[Name] LIKE N'%plank%' OR t.[Name] LIKE N'%prkno%'
                 OR t.[Name] LIKE N'%klik%' OR t.[Name] LIKE N'%burpee%' OR t.[Name] LIKE N'%mountain%'
                 OR t.[Name] LIKE N'%wall sit%' OR t.[Name] LIKE N'%sed u zdi%' OR t.[Name] LIKE N'%švihadlo%'
                 OR t.[Name] LIKE N'%jumping%' OR t.[Name] LIKE N'%zápěstí%' OR t.[Name] LIKE N'%bicycle%'
                 OR t.[Name] LIKE N'%břicho%' THEN 6 -- Tělesná průprava
            WHEN t.[Name] LIKE N'%rozcvič%' OR t.[Name] LIKE N'%rozehř%' OR t.[Name] LIKE N'%protaž%'
                 OR t.[Name] LIKE N'%mobilita%' OR t.[Name] LIKE N'%uvolnění%' OR t.[Name] LIKE N'%dynamick%' THEN 32 -- Ohebnost
            ELSE 31 -- Vedení míčku (dribbling / ball control is the default block)
        END
    FROM [Trainings] t
    WHERE t.[CreatedByUserId] = N'{SeedMarker}';

    -- 2) One Activity per training (the drill itself). Valid: 5–15 min, solo, published.
    INSERT INTO [Activities]
        ([Name],[Description],[PersonsMin],[PersonsMax],[GoaliesMin],[GoaliesMax],[DurationMin],[DurationMax],
         [Intensity],[Difficulty],[PlaceWidth],[PlaceLength],[Environment],[IsDraft],[CreatedAt],[CreatedByUserId])
    SELECT t.[Name], t.[Description], 1, 1, 0, 0, 5, 15,
           t.[Intensity], t.[Difficulty], 1, 1, t.[Environment], 0, SYSUTCDATETIME(), N'{SeedMarker}'
    FROM [Trainings] t
    WHERE t.[CreatedByUserId] = N'{SeedMarker}';

    -- 3) Tag each activity with its training's focus, so the goal-coverage rule (>=25%) passes.
    INSERT INTO [ActivityTags] ([ActivityId],[TagId])
    SELECT a.[Id], t.[TrainingGoal1Id]
    FROM [Activities] a
    JOIN [Trainings] t ON t.[Name] = a.[Name] AND t.[CreatedByUserId] = N'{SeedMarker}'
    WHERE a.[CreatedByUserId] = N'{SeedMarker}' AND t.[TrainingGoal1Id] IS NOT NULL;

    -- 4) One training part covering the whole training duration (parts must cover >=95%, <=100%).
    INSERT INTO [TrainingParts] ([Name],[Description],[Order],[Duration],[TrainingId])
    SELECT N'Hlavní část', NULL, 1, t.[Duration], t.[Id]
    FROM [Trainings] t
    WHERE t.[CreatedByUserId] = N'{SeedMarker}';

    -- 5) Put the activity into that part (1 person = home/solo).
    INSERT INTO [TrainingGroups] ([PersonsMin],[PersonsMax],[ActivityId],[TrainingPartId])
    SELECT 1, 1, a.[Id], tp.[Id]
    FROM [TrainingParts] tp
    JOIN [Trainings] t ON t.[Id] = tp.[TrainingId] AND t.[CreatedByUserId] = N'{SeedMarker}'
    JOIN [Activities] a ON a.[Name] = t.[Name] AND a.[CreatedByUserId] = N'{SeedMarker}'
    WHERE tp.[Name] = N'Hlavní část';
END
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql($@"
DELETE tg FROM [TrainingGroups] tg
    JOIN [Activities] a ON a.[Id] = tg.[ActivityId]
    WHERE a.[CreatedByUserId] = N'{SeedMarker}';

DELETE tp FROM [TrainingParts] tp
    JOIN [Trainings] t ON t.[Id] = tp.[TrainingId]
    WHERE t.[CreatedByUserId] = N'{SeedMarker}' AND tp.[Name] = N'Hlavní část';

DELETE at FROM [ActivityTags] at
    JOIN [Activities] a ON a.[Id] = at.[ActivityId]
    WHERE a.[CreatedByUserId] = N'{SeedMarker}';

UPDATE [Trainings] SET [TrainingGoal1Id] = NULL WHERE [CreatedByUserId] = N'{SeedMarker}';

DELETE FROM [Activities] WHERE [CreatedByUserId] = N'{SeedMarker}';
");
        }
    }
}
