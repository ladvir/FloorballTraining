using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FloorballTraining.Plugins.EFCoreSqlServer.Migrations
{
    /// <inheritdoc />
    public partial class ConvertTrainingGoalsToTagsAndAddNoSpecificGoal : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "NoSpecificGoal",
                table: "Trainings",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "TrainingTag",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TrainingId = table.Column<int>(type: "int", nullable: true),
                    TagId = table.Column<int>(type: "int", nullable: true),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrainingTag", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TrainingTag_Tags_TagId",
                        column: x => x.TagId,
                        principalTable: "Tags",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_TrainingTag_Trainings_TrainingId",
                        column: x => x.TrainingId,
                        principalTable: "Trainings",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_TrainingTag_TagId",
                table: "TrainingTag",
                column: "TagId");

            migrationBuilder.CreateIndex(
                name: "IX_TrainingTag_TrainingId",
                table: "TrainingTag",
                column: "TrainingId");

            // Carry existing TrainingGoal1/2/3Id data over into the new join table before the
            // old columns disappear (#163 — training goals move from up-to-3 tag slots to an
            // unlimited many-to-many relationship, mirroring ActivityTag).
            migrationBuilder.Sql(@"
INSERT INTO [TrainingTag] ([TrainingId], [TagId])
SELECT [Id], [TrainingGoal1Id] FROM [Trainings] WHERE [TrainingGoal1Id] IS NOT NULL;
INSERT INTO [TrainingTag] ([TrainingId], [TagId])
SELECT [Id], [TrainingGoal2Id] FROM [Trainings] WHERE [TrainingGoal2Id] IS NOT NULL;
INSERT INTO [TrainingTag] ([TrainingId], [TagId])
SELECT [Id], [TrainingGoal3Id] FROM [Trainings] WHERE [TrainingGoal3Id] IS NOT NULL;
");

            migrationBuilder.DropForeignKey(
                name: "FK_Trainings_Tags_TrainingGoal1Id",
                table: "Trainings");

            migrationBuilder.DropForeignKey(
                name: "FK_Trainings_Tags_TrainingGoal2Id",
                table: "Trainings");

            migrationBuilder.DropForeignKey(
                name: "FK_Trainings_Tags_TrainingGoal3Id",
                table: "Trainings");

            migrationBuilder.DropIndex(
                name: "IX_Trainings_TrainingGoal1Id",
                table: "Trainings");

            migrationBuilder.DropIndex(
                name: "IX_Trainings_TrainingGoal2Id",
                table: "Trainings");

            migrationBuilder.DropIndex(
                name: "IX_Trainings_TrainingGoal3Id",
                table: "Trainings");

            migrationBuilder.DropColumn(
                name: "TrainingGoal1Id",
                table: "Trainings");

            migrationBuilder.DropColumn(
                name: "TrainingGoal2Id",
                table: "Trainings");

            migrationBuilder.DropColumn(
                name: "TrainingGoal3Id",
                table: "Trainings");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "NoSpecificGoal",
                table: "Trainings");

            migrationBuilder.AddColumn<int>(
                name: "TrainingGoal1Id",
                table: "Trainings",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TrainingGoal2Id",
                table: "Trainings",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TrainingGoal3Id",
                table: "Trainings",
                type: "int",
                nullable: true);

            // Best-effort only: repopulates up to 3 goal-tag slots per training from whatever is
            // in TrainingTag at rollback time (numbered by Id, so the oldest 3 links win). Any
            // tags added beyond the original 3 while on the new schema are silently dropped here.
            migrationBuilder.Sql(@"
;WITH Ranked AS (
    SELECT [TrainingId], [TagId], ROW_NUMBER() OVER (PARTITION BY [TrainingId] ORDER BY [Id]) AS rn
    FROM [TrainingTag]
    WHERE [TrainingId] IS NOT NULL AND [TagId] IS NOT NULL
)
UPDATE t SET t.[TrainingGoal1Id] = r.[TagId]
FROM [Trainings] t JOIN Ranked r ON r.[TrainingId] = t.[Id] AND r.rn = 1;

;WITH Ranked AS (
    SELECT [TrainingId], [TagId], ROW_NUMBER() OVER (PARTITION BY [TrainingId] ORDER BY [Id]) AS rn
    FROM [TrainingTag]
    WHERE [TrainingId] IS NOT NULL AND [TagId] IS NOT NULL
)
UPDATE t SET t.[TrainingGoal2Id] = r.[TagId]
FROM [Trainings] t JOIN Ranked r ON r.[TrainingId] = t.[Id] AND r.rn = 2;

;WITH Ranked AS (
    SELECT [TrainingId], [TagId], ROW_NUMBER() OVER (PARTITION BY [TrainingId] ORDER BY [Id]) AS rn
    FROM [TrainingTag]
    WHERE [TrainingId] IS NOT NULL AND [TagId] IS NOT NULL
)
UPDATE t SET t.[TrainingGoal3Id] = r.[TagId]
FROM [Trainings] t JOIN Ranked r ON r.[TrainingId] = t.[Id] AND r.rn = 3;
");

            migrationBuilder.DropTable(
                name: "TrainingTag");

            migrationBuilder.CreateIndex(
                name: "IX_Trainings_TrainingGoal1Id",
                table: "Trainings",
                column: "TrainingGoal1Id");

            migrationBuilder.CreateIndex(
                name: "IX_Trainings_TrainingGoal2Id",
                table: "Trainings",
                column: "TrainingGoal2Id");

            migrationBuilder.CreateIndex(
                name: "IX_Trainings_TrainingGoal3Id",
                table: "Trainings",
                column: "TrainingGoal3Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Trainings_Tags_TrainingGoal1Id",
                table: "Trainings",
                column: "TrainingGoal1Id",
                principalTable: "Tags",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Trainings_Tags_TrainingGoal2Id",
                table: "Trainings",
                column: "TrainingGoal2Id",
                principalTable: "Tags",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Trainings_Tags_TrainingGoal3Id",
                table: "Trainings",
                column: "TrainingGoal3Id",
                principalTable: "Tags",
                principalColumn: "Id");
        }
    }
}
