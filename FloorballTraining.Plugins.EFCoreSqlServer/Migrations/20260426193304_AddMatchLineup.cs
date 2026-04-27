using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace FloorballTraining.Plugins.EFCoreSqlServer.Migrations
{
    /// <inheritdoc />
    public partial class AddMatchLineup : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FormationTemplates",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ClubId = table.Column<int>(type: "int", nullable: true),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    FormationSize = table.Column<int>(type: "int", nullable: false),
                    IncludesGoalie = table.Column<bool>(type: "bit", nullable: false),
                    IsBuiltIn = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FormationTemplates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FormationTemplates_Clubs_ClubId",
                        column: x => x.ClubId,
                        principalTable: "Clubs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "FormationTemplateSlots",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FormationTemplateId = table.Column<int>(type: "int", nullable: false),
                    Position = table.Column<int>(type: "int", nullable: false),
                    X = table.Column<double>(type: "float", nullable: false),
                    Y = table.Column<double>(type: "float", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FormationTemplateSlots", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FormationTemplateSlots_FormationTemplates_FormationTemplateId",
                        column: x => x.FormationTemplateId,
                        principalTable: "FormationTemplates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MatchLineups",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TeamId = table.Column<int>(type: "int", nullable: false),
                    AppointmentId = table.Column<int>(type: "int", nullable: true),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    FormationTemplateId = table.Column<int>(type: "int", nullable: false),
                    FormationCount = table.Column<int>(type: "int", nullable: false),
                    IsShared = table.Column<bool>(type: "bit", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MatchLineups", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MatchLineups_Appointments_AppointmentId",
                        column: x => x.AppointmentId,
                        principalTable: "Appointments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_MatchLineups_FormationTemplates_FormationTemplateId",
                        column: x => x.FormationTemplateId,
                        principalTable: "FormationTemplates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MatchLineups_Teams_TeamId",
                        column: x => x.TeamId,
                        principalTable: "Teams",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LineupFormations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MatchLineupId = table.Column<int>(type: "int", nullable: false),
                    Index = table.Column<int>(type: "int", nullable: false),
                    Label = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ColorKey = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LineupFormations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LineupFormations_MatchLineups_MatchLineupId",
                        column: x => x.MatchLineupId,
                        principalTable: "MatchLineups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LineupRosters",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MatchLineupId = table.Column<int>(type: "int", nullable: false),
                    MemberId = table.Column<int>(type: "int", nullable: true),
                    ManualName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    IsAvailable = table.Column<bool>(type: "bit", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LineupRosters", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LineupRosters_MatchLineups_MatchLineupId",
                        column: x => x.MatchLineupId,
                        principalTable: "MatchLineups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LineupRosters_Members_MemberId",
                        column: x => x.MemberId,
                        principalTable: "Members",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "LineupSlots",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    LineupFormationId = table.Column<int>(type: "int", nullable: false),
                    Position = table.Column<int>(type: "int", nullable: false),
                    RosterId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LineupSlots", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LineupSlots_LineupFormations_LineupFormationId",
                        column: x => x.LineupFormationId,
                        principalTable: "LineupFormations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LineupSlots_LineupRosters_RosterId",
                        column: x => x.RosterId,
                        principalTable: "LineupRosters",
                        principalColumn: "Id");
                });

            migrationBuilder.InsertData(
                table: "FormationTemplates",
                columns: new[] { "Id", "ClubId", "FormationSize", "IncludesGoalie", "IsBuiltIn", "Name" },
                values: new object[,]
                {
                    { 1, null, 5, true, true, "5+1 standard (2-1-2)" },
                    { 2, null, 5, true, true, "5+1 ofenzivní (1-2-2)" },
                    { 3, null, 4, true, true, "4+1" },
                    { 4, null, 3, true, true, "3+1" },
                    { 5, null, 5, false, true, "5+0 přesilovka" }
                });

            migrationBuilder.InsertData(
                table: "FormationTemplateSlots",
                columns: new[] { "Id", "FormationTemplateId", "Position", "SortOrder", "X", "Y" },
                values: new object[,]
                {
                    { 1, 1, 0, 0, 50.0, 5.0 },
                    { 2, 1, 1, 1, 70.0, 30.0 },
                    { 3, 1, 2, 2, 30.0, 30.0 },
                    { 4, 1, 3, 3, 50.0, 55.0 },
                    { 5, 1, 4, 4, 25.0, 75.0 },
                    { 6, 1, 5, 5, 75.0, 75.0 },
                    { 11, 2, 0, 0, 50.0, 5.0 },
                    { 12, 2, 1, 1, 60.0, 25.0 },
                    { 13, 2, 2, 2, 40.0, 25.0 },
                    { 14, 2, 3, 3, 50.0, 60.0 },
                    { 15, 2, 4, 4, 22.0, 80.0 },
                    { 16, 2, 5, 5, 78.0, 80.0 },
                    { 21, 3, 0, 0, 50.0, 5.0 },
                    { 22, 3, 2, 1, 50.0, 30.0 },
                    { 23, 3, 3, 2, 50.0, 60.0 },
                    { 24, 3, 4, 3, 25.0, 80.0 },
                    { 25, 3, 5, 4, 75.0, 80.0 },
                    { 31, 4, 0, 0, 50.0, 5.0 },
                    { 32, 4, 2, 1, 50.0, 30.0 },
                    { 33, 4, 3, 2, 50.0, 60.0 },
                    { 34, 4, 4, 3, 50.0, 85.0 },
                    { 41, 5, 1, 0, 70.0, 25.0 },
                    { 42, 5, 2, 1, 30.0, 25.0 },
                    { 43, 5, 3, 2, 50.0, 55.0 },
                    { 44, 5, 4, 3, 25.0, 80.0 },
                    { 45, 5, 5, 4, 75.0, 80.0 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_FormationTemplates_ClubId",
                table: "FormationTemplates",
                column: "ClubId");

            migrationBuilder.CreateIndex(
                name: "IX_FormationTemplateSlots_FormationTemplateId",
                table: "FormationTemplateSlots",
                column: "FormationTemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_LineupFormations_MatchLineupId",
                table: "LineupFormations",
                column: "MatchLineupId");

            migrationBuilder.CreateIndex(
                name: "IX_LineupRosters_MatchLineupId",
                table: "LineupRosters",
                column: "MatchLineupId");

            migrationBuilder.CreateIndex(
                name: "IX_LineupRosters_MemberId",
                table: "LineupRosters",
                column: "MemberId");

            migrationBuilder.CreateIndex(
                name: "IX_LineupSlots_LineupFormationId",
                table: "LineupSlots",
                column: "LineupFormationId");

            migrationBuilder.CreateIndex(
                name: "IX_LineupSlots_RosterId",
                table: "LineupSlots",
                column: "RosterId");

            migrationBuilder.CreateIndex(
                name: "IX_MatchLineups_AppointmentId",
                table: "MatchLineups",
                column: "AppointmentId");

            migrationBuilder.CreateIndex(
                name: "IX_MatchLineups_FormationTemplateId",
                table: "MatchLineups",
                column: "FormationTemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_MatchLineups_TeamId",
                table: "MatchLineups",
                column: "TeamId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FormationTemplateSlots");

            migrationBuilder.DropTable(
                name: "LineupSlots");

            migrationBuilder.DropTable(
                name: "LineupFormations");

            migrationBuilder.DropTable(
                name: "LineupRosters");

            migrationBuilder.DropTable(
                name: "MatchLineups");

            migrationBuilder.DropTable(
                name: "FormationTemplates");
        }
    }
}
