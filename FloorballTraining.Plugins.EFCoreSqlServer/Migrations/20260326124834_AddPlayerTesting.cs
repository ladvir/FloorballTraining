using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace FloorballTraining.Plugins.EFCoreSqlServer.Migrations
{
    /// <inheritdoc />
    public partial class AddPlayerTesting : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Gender",
                table: "Members",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "TestDefinitions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    TestType = table.Column<int>(type: "int", nullable: false),
                    Category = table.Column<int>(type: "int", nullable: false),
                    Unit = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    HigherIsBetter = table.Column<bool>(type: "bit", nullable: false),
                    ClubId = table.Column<int>(type: "int", nullable: true),
                    IsTemplate = table.Column<bool>(type: "bit", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TestDefinitions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TestDefinitions_Clubs_ClubId",
                        column: x => x.ClubId,
                        principalTable: "Clubs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "GradeOptions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TestDefinitionId = table.Column<int>(type: "int", nullable: false),
                    Label = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    NumericValue = table.Column<int>(type: "int", nullable: false),
                    Colour = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: true),
                    SortOrder = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GradeOptions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GradeOptions_TestDefinitions_TestDefinitionId",
                        column: x => x.TestDefinitionId,
                        principalTable: "TestDefinitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TestColourRanges",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TestDefinitionId = table.Column<int>(type: "int", nullable: false),
                    AgeGroupId = table.Column<int>(type: "int", nullable: true),
                    Gender = table.Column<int>(type: "int", nullable: true),
                    GreenFrom = table.Column<double>(type: "float", nullable: true),
                    GreenTo = table.Column<double>(type: "float", nullable: true),
                    YellowFrom = table.Column<double>(type: "float", nullable: true),
                    YellowTo = table.Column<double>(type: "float", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TestColourRanges", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TestColourRanges_AgeGroups_AgeGroupId",
                        column: x => x.AgeGroupId,
                        principalTable: "AgeGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_TestColourRanges_TestDefinitions_TestDefinitionId",
                        column: x => x.TestDefinitionId,
                        principalTable: "TestDefinitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TestResults",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TestDefinitionId = table.Column<int>(type: "int", nullable: false),
                    MemberId = table.Column<int>(type: "int", nullable: false),
                    NumericValue = table.Column<double>(type: "float", nullable: true),
                    GradeOptionId = table.Column<int>(type: "int", nullable: true),
                    TestDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Note = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    RecordedByUserId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TestResults", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TestResults_GradeOptions_GradeOptionId",
                        column: x => x.GradeOptionId,
                        principalTable: "GradeOptions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TestResults_Members_MemberId",
                        column: x => x.MemberId,
                        principalTable: "Members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TestResults_TestDefinitions_TestDefinitionId",
                        column: x => x.TestDefinitionId,
                        principalTable: "TestDefinitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "TestDefinitions",
                columns: new[] { "Id", "Category", "ClubId", "Description", "HigherIsBetter", "IsTemplate", "Name", "SortOrder", "TestType", "Unit" },
                values: new object[,]
                {
                    { 1000, 5, null, null, true, true, "Tělesná výška", 1, 0, "cm" },
                    { 1001, 5, null, null, false, true, "Tělesná hmotnost", 2, 0, "kg" },
                    { 1002, 5, null, null, false, true, "Tělesný tuk", 3, 0, "%" },
                    { 1003, 5, null, null, false, true, "Držení hole", 4, 1, null },
                    { 1010, 2, null, null, false, true, "Hluboký předklon", 10, 1, null },
                    { 1011, 2, null, null, false, true, "V-test (vnitřní strana stehen)", 11, 1, null },
                    { 1012, 2, null, null, false, true, "Protažení přední strany stehna", 12, 1, null },
                    { 1020, 0, null, null, false, true, "Sprint 20 m", 20, 0, "s" },
                    { 1021, 0, null, null, true, true, "Skok z místa snožmo", 21, 0, "cm" },
                    { 1022, 0, null, null, false, true, "Illinois agility bez hole", 22, 0, "s" },
                    { 1023, 0, null, null, true, true, "Vznos na hrazdě", 23, 0, "počet" },
                    { 1024, 0, null, null, true, true, "Hluboký zadní dřep 1RM", 24, 0, "kg" },
                    { 1025, 0, null, null, true, true, "Bench press 1RM", 25, 0, "kg" },
                    { 1026, 0, null, null, true, true, "Yo-Yo IRT Level 1", 26, 0, "m" },
                    { 1030, 1, null, null, true, true, "Manipulace s míčkem (osmičky za 45 s)", 30, 0, "počet" },
                    { 1031, 1, null, null, true, true, "Přihrávka z pohybu", 31, 0, "počet" },
                    { 1032, 1, null, null, true, true, "Střelba z pohybu", 32, 0, "počet" },
                    { 1033, 1, null, null, false, true, "Illinois agility s holí a míčkem", 33, 0, "s" },
                    { 1040, 4, null, null, false, true, "Brankářský test - reakce", 40, 0, "s" },
                    { 1041, 4, null, null, false, true, "Brankářský test - pohyb v brance", 41, 0, "s" },
                    { 1042, 4, null, null, true, true, "Brankářský test - výhozy", 42, 0, "počet" },
                    { 1043, 4, null, null, false, true, "Brankářský test - rozklek", 43, 0, "s" }
                });

            migrationBuilder.InsertData(
                table: "GradeOptions",
                columns: new[] { "Id", "Colour", "Label", "NumericValue", "SortOrder", "TestDefinitionId" },
                values: new object[,]
                {
                    { 1000, null, "Levá", 1, 1, 1003 },
                    { 1001, null, "Pravá", 2, 2, 1003 },
                    { 1010, "#ef4444", "Zkrácené", 1, 1, 1010 },
                    { 1011, "#22c55e", "OK", 2, 2, 1010 },
                    { 1012, "#eab308", "Hypermobilní", 3, 3, 1010 },
                    { 1013, "#ef4444", "Zkrácené", 1, 1, 1011 },
                    { 1014, "#22c55e", "OK", 2, 2, 1011 },
                    { 1015, "#eab308", "Hypermobilní", 3, 3, 1011 },
                    { 1016, "#ef4444", "Zkrácené", 1, 1, 1012 },
                    { 1017, "#22c55e", "OK", 2, 2, 1012 },
                    { 1018, "#eab308", "Hypermobilní", 3, 3, 1012 }
                });

            migrationBuilder.InsertData(
                table: "TestColourRanges",
                columns: new[] { "Id", "AgeGroupId", "Gender", "GreenFrom", "GreenTo", "TestDefinitionId", "YellowFrom", "YellowTo" },
                values: new object[,]
                {
                    { 1000, 13, 0, 0.0, 3.5, 1020, 3.5, 4.0 },
                    { 1001, 13, 1, 0.0, 3.7000000000000002, 1020, 3.7000000000000002, 4.2000000000000002 },
                    { 1002, 15, 0, 0.0, 3.2999999999999998, 1020, 3.2999999999999998, 3.7999999999999998 },
                    { 1003, 15, 1, 0.0, 3.5, 1020, 3.5, 4.0 },
                    { 1004, 17, 0, 0.0, 3.1000000000000001, 1020, 3.1000000000000001, 3.5 },
                    { 1005, 17, 1, 0.0, 3.3999999999999999, 1020, 3.3999999999999999, 3.7999999999999998 },
                    { 1010, 13, 0, 180.0, 300.0, 1021, 150.0, 180.0 },
                    { 1011, 13, 1, 160.0, 280.0, 1021, 130.0, 160.0 },
                    { 1012, 15, 0, 200.0, 320.0, 1021, 170.0, 200.0 },
                    { 1013, 15, 1, 175.0, 300.0, 1021, 145.0, 175.0 },
                    { 1020, 15, 0, 1200.0, 3000.0, 1026, 800.0, 1200.0 },
                    { 1021, 15, 1, 800.0, 2500.0, 1026, 500.0, 800.0 },
                    { 1022, 17, 0, 1600.0, 3500.0, 1026, 1100.0, 1600.0 },
                    { 1023, 17, 1, 1000.0, 3000.0, 1026, 600.0, 1000.0 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_GradeOptions_TestDefinitionId",
                table: "GradeOptions",
                column: "TestDefinitionId");

            migrationBuilder.CreateIndex(
                name: "IX_TestColourRanges_AgeGroupId",
                table: "TestColourRanges",
                column: "AgeGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_TestColourRanges_TestDefinitionId_AgeGroupId_Gender",
                table: "TestColourRanges",
                columns: new[] { "TestDefinitionId", "AgeGroupId", "Gender" },
                unique: true,
                filter: "[AgeGroupId] IS NOT NULL AND [Gender] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_TestDefinitions_Category",
                table: "TestDefinitions",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_TestDefinitions_ClubId",
                table: "TestDefinitions",
                column: "ClubId");

            migrationBuilder.CreateIndex(
                name: "IX_TestResults_GradeOptionId",
                table: "TestResults",
                column: "GradeOptionId");

            migrationBuilder.CreateIndex(
                name: "IX_TestResults_MemberId",
                table: "TestResults",
                column: "MemberId");

            migrationBuilder.CreateIndex(
                name: "IX_TestResults_TestDefinitionId_MemberId",
                table: "TestResults",
                columns: new[] { "TestDefinitionId", "MemberId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TestColourRanges");

            migrationBuilder.DropTable(
                name: "TestResults");

            migrationBuilder.DropTable(
                name: "GradeOptions");

            migrationBuilder.DropTable(
                name: "TestDefinitions");

            migrationBuilder.DropColumn(
                name: "Gender",
                table: "Members");
        }
    }
}
