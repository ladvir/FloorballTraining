using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FloorballTraining.Plugins.EFCoreSqlServer.Migrations
{
    /// <inheritdoc />
    public partial class MesoMicroGoalSkills : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MesocycleTags");

            migrationBuilder.DropTable(
                name: "MicrocycleTags");

            migrationBuilder.AddColumn<int>(
                name: "GoalSkill1Id",
                table: "Microcycles",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "GoalSkill2Id",
                table: "Microcycles",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "GoalSkill3Id",
                table: "Microcycles",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "GoalSkill1Id",
                table: "Mesocycles",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "GoalSkill2Id",
                table: "Mesocycles",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "GoalSkill3Id",
                table: "Mesocycles",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Microcycles_GoalSkill1Id",
                table: "Microcycles",
                column: "GoalSkill1Id");

            migrationBuilder.CreateIndex(
                name: "IX_Microcycles_GoalSkill2Id",
                table: "Microcycles",
                column: "GoalSkill2Id");

            migrationBuilder.CreateIndex(
                name: "IX_Microcycles_GoalSkill3Id",
                table: "Microcycles",
                column: "GoalSkill3Id");

            migrationBuilder.CreateIndex(
                name: "IX_Mesocycles_GoalSkill1Id",
                table: "Mesocycles",
                column: "GoalSkill1Id");

            migrationBuilder.CreateIndex(
                name: "IX_Mesocycles_GoalSkill2Id",
                table: "Mesocycles",
                column: "GoalSkill2Id");

            migrationBuilder.CreateIndex(
                name: "IX_Mesocycles_GoalSkill3Id",
                table: "Mesocycles",
                column: "GoalSkill3Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Mesocycles_Skills_GoalSkill1Id",
                table: "Mesocycles",
                column: "GoalSkill1Id",
                principalTable: "Skills",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Mesocycles_Skills_GoalSkill2Id",
                table: "Mesocycles",
                column: "GoalSkill2Id",
                principalTable: "Skills",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Mesocycles_Skills_GoalSkill3Id",
                table: "Mesocycles",
                column: "GoalSkill3Id",
                principalTable: "Skills",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Microcycles_Skills_GoalSkill1Id",
                table: "Microcycles",
                column: "GoalSkill1Id",
                principalTable: "Skills",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Microcycles_Skills_GoalSkill2Id",
                table: "Microcycles",
                column: "GoalSkill2Id",
                principalTable: "Skills",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Microcycles_Skills_GoalSkill3Id",
                table: "Microcycles",
                column: "GoalSkill3Id",
                principalTable: "Skills",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Mesocycles_Skills_GoalSkill1Id",
                table: "Mesocycles");

            migrationBuilder.DropForeignKey(
                name: "FK_Mesocycles_Skills_GoalSkill2Id",
                table: "Mesocycles");

            migrationBuilder.DropForeignKey(
                name: "FK_Mesocycles_Skills_GoalSkill3Id",
                table: "Mesocycles");

            migrationBuilder.DropForeignKey(
                name: "FK_Microcycles_Skills_GoalSkill1Id",
                table: "Microcycles");

            migrationBuilder.DropForeignKey(
                name: "FK_Microcycles_Skills_GoalSkill2Id",
                table: "Microcycles");

            migrationBuilder.DropForeignKey(
                name: "FK_Microcycles_Skills_GoalSkill3Id",
                table: "Microcycles");

            migrationBuilder.DropIndex(
                name: "IX_Microcycles_GoalSkill1Id",
                table: "Microcycles");

            migrationBuilder.DropIndex(
                name: "IX_Microcycles_GoalSkill2Id",
                table: "Microcycles");

            migrationBuilder.DropIndex(
                name: "IX_Microcycles_GoalSkill3Id",
                table: "Microcycles");

            migrationBuilder.DropIndex(
                name: "IX_Mesocycles_GoalSkill1Id",
                table: "Mesocycles");

            migrationBuilder.DropIndex(
                name: "IX_Mesocycles_GoalSkill2Id",
                table: "Mesocycles");

            migrationBuilder.DropIndex(
                name: "IX_Mesocycles_GoalSkill3Id",
                table: "Mesocycles");

            migrationBuilder.DropColumn(
                name: "GoalSkill1Id",
                table: "Microcycles");

            migrationBuilder.DropColumn(
                name: "GoalSkill2Id",
                table: "Microcycles");

            migrationBuilder.DropColumn(
                name: "GoalSkill3Id",
                table: "Microcycles");

            migrationBuilder.DropColumn(
                name: "GoalSkill1Id",
                table: "Mesocycles");

            migrationBuilder.DropColumn(
                name: "GoalSkill2Id",
                table: "Mesocycles");

            migrationBuilder.DropColumn(
                name: "GoalSkill3Id",
                table: "Mesocycles");

            migrationBuilder.CreateTable(
                name: "MesocycleTags",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MesocycleId = table.Column<int>(type: "int", nullable: false),
                    TagId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MesocycleTags", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MesocycleTags_Mesocycles_MesocycleId",
                        column: x => x.MesocycleId,
                        principalTable: "Mesocycles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MesocycleTags_Tags_TagId",
                        column: x => x.TagId,
                        principalTable: "Tags",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MicrocycleTags",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MicrocycleId = table.Column<int>(type: "int", nullable: false),
                    TagId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MicrocycleTags", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MicrocycleTags_Microcycles_MicrocycleId",
                        column: x => x.MicrocycleId,
                        principalTable: "Microcycles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MicrocycleTags_Tags_TagId",
                        column: x => x.TagId,
                        principalTable: "Tags",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MesocycleTags_MesocycleId_TagId",
                table: "MesocycleTags",
                columns: new[] { "MesocycleId", "TagId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MesocycleTags_TagId",
                table: "MesocycleTags",
                column: "TagId");

            migrationBuilder.CreateIndex(
                name: "IX_MicrocycleTags_MicrocycleId_TagId",
                table: "MicrocycleTags",
                columns: new[] { "MicrocycleId", "TagId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MicrocycleTags_TagId",
                table: "MicrocycleTags",
                column: "TagId");
        }
    }
}
