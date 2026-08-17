using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FloorballTraining.Plugins.EFCoreSqlServer.Migrations
{
    /// <inheritdoc />
    public partial class AddStatTracker : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "StatTrackers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EventCategory = table.Column<int>(type: "int", nullable: false),
                    TournamentMatchId = table.Column<int>(type: "int", nullable: true),
                    AppointmentId = table.Column<int>(type: "int", nullable: true),
                    TeamId = table.Column<int>(type: "int", nullable: false),
                    SeasonId = table.Column<int>(type: "int", nullable: true),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StatTrackers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StatTrackers_Appointments_AppointmentId",
                        column: x => x.AppointmentId,
                        principalTable: "Appointments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_StatTrackers_Seasons_SeasonId",
                        column: x => x.SeasonId,
                        principalTable: "Seasons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_StatTrackers_Teams_TeamId",
                        column: x => x.TeamId,
                        principalTable: "Teams",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_StatTrackers_TournamentMatches_TournamentMatchId",
                        column: x => x.TournamentMatchId,
                        principalTable: "TournamentMatches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "TeamStatMetricTemplates",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TeamId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    IsGoalkeeper = table.Column<bool>(type: "bit", nullable: false),
                    AppliesTo = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TeamStatMetricTemplates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TeamStatMetricTemplates_Teams_TeamId",
                        column: x => x.TeamId,
                        principalTable: "Teams",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "StatTrackerMetrics",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    StatTrackerId = table.Column<int>(type: "int", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    IsGoalkeeper = table.Column<bool>(type: "bit", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StatTrackerMetrics", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StatTrackerMetrics_StatTrackers_StatTrackerId",
                        column: x => x.StatTrackerId,
                        principalTable: "StatTrackers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "StatTrackerParticipants",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    StatTrackerId = table.Column<int>(type: "int", nullable: false),
                    MemberId = table.Column<int>(type: "int", nullable: false),
                    Role = table.Column<int>(type: "int", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StatTrackerParticipants", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StatTrackerParticipants_Members_MemberId",
                        column: x => x.MemberId,
                        principalTable: "Members",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_StatTrackerParticipants_StatTrackers_StatTrackerId",
                        column: x => x.StatTrackerId,
                        principalTable: "StatTrackers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "StatTrackerEntries",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    StatTrackerId = table.Column<int>(type: "int", nullable: false),
                    StatTrackerParticipantId = table.Column<int>(type: "int", nullable: false),
                    StatTrackerMetricId = table.Column<int>(type: "int", nullable: false),
                    Delta = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StatTrackerEntries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StatTrackerEntries_StatTrackerMetrics_StatTrackerMetricId",
                        column: x => x.StatTrackerMetricId,
                        principalTable: "StatTrackerMetrics",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_StatTrackerEntries_StatTrackerParticipants_StatTrackerParticipantId",
                        column: x => x.StatTrackerParticipantId,
                        principalTable: "StatTrackerParticipants",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_StatTrackerEntries_StatTrackers_StatTrackerId",
                        column: x => x.StatTrackerId,
                        principalTable: "StatTrackers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_StatTrackerEntries_StatTrackerId",
                table: "StatTrackerEntries",
                column: "StatTrackerId");

            migrationBuilder.CreateIndex(
                name: "IX_StatTrackerEntries_StatTrackerId_CreatedAt",
                table: "StatTrackerEntries",
                columns: new[] { "StatTrackerId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_StatTrackerEntries_StatTrackerMetricId",
                table: "StatTrackerEntries",
                column: "StatTrackerMetricId");

            migrationBuilder.CreateIndex(
                name: "IX_StatTrackerEntries_StatTrackerParticipantId",
                table: "StatTrackerEntries",
                column: "StatTrackerParticipantId");

            migrationBuilder.CreateIndex(
                name: "IX_StatTrackerMetrics_StatTrackerId",
                table: "StatTrackerMetrics",
                column: "StatTrackerId");

            migrationBuilder.CreateIndex(
                name: "IX_StatTrackerParticipants_MemberId",
                table: "StatTrackerParticipants",
                column: "MemberId");

            migrationBuilder.CreateIndex(
                name: "IX_StatTrackerParticipants_StatTrackerId",
                table: "StatTrackerParticipants",
                column: "StatTrackerId");

            migrationBuilder.CreateIndex(
                name: "IX_StatTrackers_AppointmentId",
                table: "StatTrackers",
                column: "AppointmentId");

            migrationBuilder.CreateIndex(
                name: "IX_StatTrackers_SeasonId",
                table: "StatTrackers",
                column: "SeasonId");

            migrationBuilder.CreateIndex(
                name: "IX_StatTrackers_TeamId",
                table: "StatTrackers",
                column: "TeamId");

            migrationBuilder.CreateIndex(
                name: "IX_StatTrackers_TeamId_SeasonId_EventCategory",
                table: "StatTrackers",
                columns: new[] { "TeamId", "SeasonId", "EventCategory" });

            migrationBuilder.CreateIndex(
                name: "IX_StatTrackers_TournamentMatchId",
                table: "StatTrackers",
                column: "TournamentMatchId");

            migrationBuilder.CreateIndex(
                name: "IX_TeamStatMetricTemplates_TeamId",
                table: "TeamStatMetricTemplates",
                column: "TeamId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "StatTrackerEntries");

            migrationBuilder.DropTable(
                name: "TeamStatMetricTemplates");

            migrationBuilder.DropTable(
                name: "StatTrackerMetrics");

            migrationBuilder.DropTable(
                name: "StatTrackerParticipants");

            migrationBuilder.DropTable(
                name: "StatTrackers");
        }
    }
}
