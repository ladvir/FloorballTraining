using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FloorballTraining.Plugins.EFCoreSqlServer.Migrations
{
    /// <inheritdoc />
    public partial class FixOffensiveFormationTemplateShape : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Template "5+1 ofenzivní (1-2-2)" had its RD/LD slots (Position 1/2) both placed
            // in the back row, same as the "2-1-2" template, so it rendered identically.
            // Move LD back alone and pull RD up next to C for a real 1-2-2 shape.
            migrationBuilder.Sql(@"
UPDATE fts
SET fts.X = v.X, fts.Y = v.Y
FROM FormationTemplateSlots fts
INNER JOIN FormationTemplates ft ON ft.Id = fts.FormationTemplateId
INNER JOIN (VALUES (1, 65.0, 50.0), (2, 50.0, 20.0), (3, 35.0, 50.0)) AS v(Position, X, Y)
    ON v.Position = fts.Position
WHERE ft.Name = N'5+1 ofenzivní (1-2-2)';
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
UPDATE fts
SET fts.X = v.X, fts.Y = v.Y
FROM FormationTemplateSlots fts
INNER JOIN FormationTemplates ft ON ft.Id = fts.FormationTemplateId
INNER JOIN (VALUES (1, 60.0, 25.0), (2, 40.0, 25.0), (3, 50.0, 60.0)) AS v(Position, X, Y)
    ON v.Position = fts.Position
WHERE ft.Name = N'5+1 ofenzivní (1-2-2)';
");
        }
    }
}
