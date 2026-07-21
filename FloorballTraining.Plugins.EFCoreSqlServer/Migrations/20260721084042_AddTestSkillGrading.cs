using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FloorballTraining.Plugins.EFCoreSqlServer.Migrations
{
    /// <inheritdoc />
    public partial class AddTestSkillGrading : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "SkillId",
                table: "TestDefinitions",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SourceTestResultId",
                table: "PlayerSkillRatings",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SkillGrade",
                table: "GradeOptions",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "TestSkillGradeRanges",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TestDefinitionId = table.Column<int>(type: "int", nullable: false),
                    AgeGroupId = table.Column<int>(type: "int", nullable: true),
                    Gender = table.Column<int>(type: "int", nullable: true),
                    Grade1From = table.Column<double>(type: "float", nullable: true),
                    Grade1To = table.Column<double>(type: "float", nullable: true),
                    Grade2From = table.Column<double>(type: "float", nullable: true),
                    Grade2To = table.Column<double>(type: "float", nullable: true),
                    Grade3From = table.Column<double>(type: "float", nullable: true),
                    Grade3To = table.Column<double>(type: "float", nullable: true),
                    Grade4From = table.Column<double>(type: "float", nullable: true),
                    Grade4To = table.Column<double>(type: "float", nullable: true),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TestSkillGradeRanges", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TestSkillGradeRanges_AgeGroups_AgeGroupId",
                        column: x => x.AgeGroupId,
                        principalTable: "AgeGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_TestSkillGradeRanges_TestDefinitions_TestDefinitionId",
                        column: x => x.TestDefinitionId,
                        principalTable: "TestDefinitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.UpdateData(
                table: "GradeOptions",
                keyColumn: "Id",
                keyValue: 1000,
                column: "SkillGrade",
                value: null);

            migrationBuilder.UpdateData(
                table: "GradeOptions",
                keyColumn: "Id",
                keyValue: 1001,
                column: "SkillGrade",
                value: null);

            migrationBuilder.UpdateData(
                table: "GradeOptions",
                keyColumn: "Id",
                keyValue: 1010,
                column: "SkillGrade",
                value: null);

            migrationBuilder.UpdateData(
                table: "GradeOptions",
                keyColumn: "Id",
                keyValue: 1011,
                column: "SkillGrade",
                value: null);

            migrationBuilder.UpdateData(
                table: "GradeOptions",
                keyColumn: "Id",
                keyValue: 1012,
                column: "SkillGrade",
                value: null);

            migrationBuilder.UpdateData(
                table: "GradeOptions",
                keyColumn: "Id",
                keyValue: 1013,
                column: "SkillGrade",
                value: null);

            migrationBuilder.UpdateData(
                table: "GradeOptions",
                keyColumn: "Id",
                keyValue: 1014,
                column: "SkillGrade",
                value: null);

            migrationBuilder.UpdateData(
                table: "GradeOptions",
                keyColumn: "Id",
                keyValue: 1015,
                column: "SkillGrade",
                value: null);

            migrationBuilder.UpdateData(
                table: "GradeOptions",
                keyColumn: "Id",
                keyValue: 1016,
                column: "SkillGrade",
                value: null);

            migrationBuilder.UpdateData(
                table: "GradeOptions",
                keyColumn: "Id",
                keyValue: 1017,
                column: "SkillGrade",
                value: null);

            migrationBuilder.UpdateData(
                table: "GradeOptions",
                keyColumn: "Id",
                keyValue: 1018,
                column: "SkillGrade",
                value: null);

            migrationBuilder.UpdateData(
                table: "TestDefinitions",
                keyColumn: "Id",
                keyValue: 1000,
                column: "SkillId",
                value: null);

            migrationBuilder.UpdateData(
                table: "TestDefinitions",
                keyColumn: "Id",
                keyValue: 1001,
                column: "SkillId",
                value: null);

            migrationBuilder.UpdateData(
                table: "TestDefinitions",
                keyColumn: "Id",
                keyValue: 1002,
                column: "SkillId",
                value: null);

            migrationBuilder.UpdateData(
                table: "TestDefinitions",
                keyColumn: "Id",
                keyValue: 1003,
                column: "SkillId",
                value: null);

            migrationBuilder.UpdateData(
                table: "TestDefinitions",
                keyColumn: "Id",
                keyValue: 1010,
                column: "SkillId",
                value: null);

            migrationBuilder.UpdateData(
                table: "TestDefinitions",
                keyColumn: "Id",
                keyValue: 1011,
                column: "SkillId",
                value: null);

            migrationBuilder.UpdateData(
                table: "TestDefinitions",
                keyColumn: "Id",
                keyValue: 1012,
                column: "SkillId",
                value: null);

            migrationBuilder.UpdateData(
                table: "TestDefinitions",
                keyColumn: "Id",
                keyValue: 1020,
                column: "SkillId",
                value: null);

            migrationBuilder.UpdateData(
                table: "TestDefinitions",
                keyColumn: "Id",
                keyValue: 1021,
                column: "SkillId",
                value: null);

            migrationBuilder.UpdateData(
                table: "TestDefinitions",
                keyColumn: "Id",
                keyValue: 1022,
                column: "SkillId",
                value: null);

            migrationBuilder.UpdateData(
                table: "TestDefinitions",
                keyColumn: "Id",
                keyValue: 1023,
                column: "SkillId",
                value: null);

            migrationBuilder.UpdateData(
                table: "TestDefinitions",
                keyColumn: "Id",
                keyValue: 1024,
                column: "SkillId",
                value: null);

            migrationBuilder.UpdateData(
                table: "TestDefinitions",
                keyColumn: "Id",
                keyValue: 1025,
                column: "SkillId",
                value: null);

            migrationBuilder.UpdateData(
                table: "TestDefinitions",
                keyColumn: "Id",
                keyValue: 1026,
                column: "SkillId",
                value: null);

            migrationBuilder.UpdateData(
                table: "TestDefinitions",
                keyColumn: "Id",
                keyValue: 1030,
                column: "SkillId",
                value: null);

            migrationBuilder.UpdateData(
                table: "TestDefinitions",
                keyColumn: "Id",
                keyValue: 1031,
                column: "SkillId",
                value: null);

            migrationBuilder.UpdateData(
                table: "TestDefinitions",
                keyColumn: "Id",
                keyValue: 1032,
                column: "SkillId",
                value: null);

            migrationBuilder.UpdateData(
                table: "TestDefinitions",
                keyColumn: "Id",
                keyValue: 1033,
                column: "SkillId",
                value: null);

            migrationBuilder.UpdateData(
                table: "TestDefinitions",
                keyColumn: "Id",
                keyValue: 1040,
                column: "SkillId",
                value: null);

            migrationBuilder.UpdateData(
                table: "TestDefinitions",
                keyColumn: "Id",
                keyValue: 1041,
                column: "SkillId",
                value: null);

            migrationBuilder.UpdateData(
                table: "TestDefinitions",
                keyColumn: "Id",
                keyValue: 1042,
                column: "SkillId",
                value: null);

            migrationBuilder.UpdateData(
                table: "TestDefinitions",
                keyColumn: "Id",
                keyValue: 1043,
                column: "SkillId",
                value: null);

            migrationBuilder.CreateIndex(
                name: "IX_TestDefinitions_SkillId",
                table: "TestDefinitions",
                column: "SkillId");

            migrationBuilder.CreateIndex(
                name: "IX_PlayerSkillRatings_SourceTestResultId",
                table: "PlayerSkillRatings",
                column: "SourceTestResultId");

            migrationBuilder.CreateIndex(
                name: "IX_TestSkillGradeRanges_AgeGroupId",
                table: "TestSkillGradeRanges",
                column: "AgeGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_TestSkillGradeRanges_TestDefinitionId_AgeGroupId_Gender",
                table: "TestSkillGradeRanges",
                columns: new[] { "TestDefinitionId", "AgeGroupId", "Gender" },
                unique: true,
                filter: "[AgeGroupId] IS NOT NULL AND [Gender] IS NOT NULL");

            migrationBuilder.AddForeignKey(
                name: "FK_PlayerSkillRatings_TestResults_SourceTestResultId",
                table: "PlayerSkillRatings",
                column: "SourceTestResultId",
                principalTable: "TestResults",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_TestDefinitions_Skills_SkillId",
                table: "TestDefinitions",
                column: "SkillId",
                principalTable: "Skills",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PlayerSkillRatings_TestResults_SourceTestResultId",
                table: "PlayerSkillRatings");

            migrationBuilder.DropForeignKey(
                name: "FK_TestDefinitions_Skills_SkillId",
                table: "TestDefinitions");

            migrationBuilder.DropTable(
                name: "TestSkillGradeRanges");

            migrationBuilder.DropIndex(
                name: "IX_TestDefinitions_SkillId",
                table: "TestDefinitions");

            migrationBuilder.DropIndex(
                name: "IX_PlayerSkillRatings_SourceTestResultId",
                table: "PlayerSkillRatings");

            migrationBuilder.DropColumn(
                name: "SkillId",
                table: "TestDefinitions");

            migrationBuilder.DropColumn(
                name: "SourceTestResultId",
                table: "PlayerSkillRatings");

            migrationBuilder.DropColumn(
                name: "SkillGrade",
                table: "GradeOptions");
        }
    }
}
