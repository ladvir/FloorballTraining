using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TrainingDataAccess.Migrations
{
    /// <inheritdoc />
    public partial class TrainingGroup : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TrainingGroups",
                columns: table => new
                {
                    TrainingGroupId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", nullable: true),
                    TrainingPartId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrainingGroups", x => x.TrainingGroupId);
                    table.ForeignKey(
                        name: "FK_TrainingGroups_TrainingParts_TrainingPartId",
                        column: x => x.TrainingPartId,
                        principalTable: "TrainingParts",
                        principalColumn: "TrainingPartId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TrainingGroupActivities",
                columns: table => new
                {
                    ActivityId = table.Column<int>(type: "INTEGER", nullable: false),
                    TrainingGroupId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrainingGroupActivities", x => new { x.TrainingGroupId, x.ActivityId });
                    table.ForeignKey(
                        name: "FK_TrainingGroupActivities_Activities_ActivityId",
                        column: x => x.ActivityId,
                        principalTable: "Activities",
                        principalColumn: "ActivityId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TrainingGroupActivities_TrainingGroups_TrainingGroupId",
                        column: x => x.TrainingGroupId,
                        principalTable: "TrainingGroups",
                        principalColumn: "TrainingGroupId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TrainingGroupActivities_ActivityId",
                table: "TrainingGroupActivities",
                column: "ActivityId");

            migrationBuilder.CreateIndex(
                name: "IX_TrainingGroups_TrainingPartId",
                table: "TrainingGroups",
                column: "TrainingPartId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TrainingGroupActivities");

            migrationBuilder.DropTable(
                name: "TrainingGroups");
        }
    }
}
