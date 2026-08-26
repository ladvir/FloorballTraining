using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FloorballTraining.Plugins.EFCoreSqlServer.Migrations
{
    // Tags now duplicating a Skill or SkillCategory (either literally, or via the #163 tag→skill
    // mapping already applied by MigrateTagsToSkills) are redundant catalog entries — the skill
    // already covers that concept — so they're removed outright. Resolved BY NAME at execution
    // time (never by id), same rule as MigrateTagsToSkills: dev/prod have independently-generated
    // ids for "the same" row.
    /// <inheritdoc />
    public partial class DeleteTagsMatchingSkillsOrCategories : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
-- The 6 tags whose old goal-tag name differs from its corresponding skill's name (already
-- converted to that skill by MigrateTagsToSkills) — same mapping, kept in sync deliberately.
DECLARE @Mapping TABLE (TagName NVARCHAR(200) COLLATE DATABASE_DEFAULT);
INSERT INTO @Mapping (TagName) VALUES
    (N'Uvolňování'), (N'Ohebnost'), (N'Postřeh'), (N'Herní myšlení'),
    (N'Spolupráce v týmu'), (N'Florbalový dribling');

DECLARE @Candidates TABLE (TagId INT PRIMARY KEY);
INSERT INTO @Candidates (TagId)
SELECT DISTINCT t.Id
FROM [Tags] t
WHERE EXISTS (SELECT 1 FROM [Skills] s WHERE s.Name COLLATE DATABASE_DEFAULT = t.Name COLLATE DATABASE_DEFAULT)
   OR EXISTS (SELECT 1 FROM [SkillCategories] c WHERE c.Name COLLATE DATABASE_DEFAULT = t.Name COLLATE DATABASE_DEFAULT)
   OR EXISTS (SELECT 1 FROM @Mapping m WHERE m.TagName = t.Name COLLATE DATABASE_DEFAULT);

-- Break any parent link between two candidates first, so deleting one doesn't FK-block on the other.
UPDATE c SET c.ParentTagId = NULL
FROM [Tags] c
JOIN @Candidates child ON child.TagId = c.Id
JOIN @Candidates parent ON parent.TagId = c.ParentTagId;

DELETE FROM [ActivityTags] WHERE TagId IN (SELECT TagId FROM @Candidates);
DELETE FROM [TrainingTag] WHERE TagId IN (SELECT TagId FROM @Candidates);

-- Leave alone (don't delete) any candidate still used as a parent by a tag outside this batch —
-- same safety net as TagEFCoreRepository.DeleteTagAsync's 'usedAsParents' check.
DELETE t
FROM [Tags] t
JOIN @Candidates cand ON cand.TagId = t.Id
WHERE NOT EXISTS (SELECT 1 FROM [Tags] child WHERE child.ParentTagId = t.Id);
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Irreversible: the deleted Tag rows (name/color/parent/IsTrainingGoal) aren't
            // preserved anywhere else, so there's nothing to reconstruct them from.
        }
    }
}
