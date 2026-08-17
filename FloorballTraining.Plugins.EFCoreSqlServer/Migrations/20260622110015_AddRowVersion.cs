using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FloorballTraining.Plugins.EFCoreSqlServer.Migrations
{
    /// <inheritdoc />
    public partial class AddRowVersion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "Trainings",
                type: "rowversion",
                rowVersion: true,
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "TrainingParts",
                type: "rowversion",
                rowVersion: true,
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "TrainingGroups",
                type: "rowversion",
                rowVersion: true,
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "TrainingAgeGroups",
                type: "rowversion",
                rowVersion: true,
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "TournamentTeams",
                type: "rowversion",
                rowVersion: true,
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "TournamentSpecialTasks",
                type: "rowversion",
                rowVersion: true,
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "Tournaments",
                type: "rowversion",
                rowVersion: true,
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "TournamentMatchTaskCompletions",
                type: "rowversion",
                rowVersion: true,
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "TournamentMatches",
                type: "rowversion",
                rowVersion: true,
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "TestResults",
                type: "rowversion",
                rowVersion: true,
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "TestDefinitions",
                type: "rowversion",
                rowVersion: true,
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "TestColourRanges",
                type: "rowversion",
                rowVersion: true,
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "TeamStatMetricTemplates",
                type: "rowversion",
                rowVersion: true,
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "Teams",
                type: "rowversion",
                rowVersion: true,
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "TeamMembers",
                type: "rowversion",
                rowVersion: true,
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "Tags",
                type: "rowversion",
                rowVersion: true,
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "StatTrackers",
                type: "rowversion",
                rowVersion: true,
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "StatTrackerParticipants",
                type: "rowversion",
                rowVersion: true,
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "StatTrackerMetrics",
                type: "rowversion",
                rowVersion: true,
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "StatTrackerEntries",
                type: "rowversion",
                rowVersion: true,
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "Seasons",
                type: "rowversion",
                rowVersion: true,
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "RoleRequests",
                type: "rowversion",
                rowVersion: true,
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "RepeatingPatterns",
                type: "rowversion",
                rowVersion: true,
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "Places",
                type: "rowversion",
                rowVersion: true,
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "Members",
                type: "rowversion",
                rowVersion: true,
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "MatchLineups",
                type: "rowversion",
                rowVersion: true,
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "LineupSlots",
                type: "rowversion",
                rowVersion: true,
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "LineupRosters",
                type: "rowversion",
                rowVersion: true,
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "LineupFormations",
                type: "rowversion",
                rowVersion: true,
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "GradeOptions",
                type: "rowversion",
                rowVersion: true,
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "FormationTemplateSlots",
                type: "rowversion",
                rowVersion: true,
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "FormationTemplates",
                type: "rowversion",
                rowVersion: true,
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "Equipments",
                type: "rowversion",
                rowVersion: true,
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "Clubs",
                type: "rowversion",
                rowVersion: true,
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "AppointmentTestDefinitions",
                type: "rowversion",
                rowVersion: true,
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "Appointments",
                type: "rowversion",
                rowVersion: true,
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "AppointmentRatings",
                type: "rowversion",
                rowVersion: true,
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "AgeGroups",
                type: "rowversion",
                rowVersion: true,
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "ActivityTags",
                type: "rowversion",
                rowVersion: true,
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "ActivityMedium",
                type: "rowversion",
                rowVersion: true,
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "ActivityEquipments",
                type: "rowversion",
                rowVersion: true,
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "ActivityAgeGroups",
                type: "rowversion",
                rowVersion: true,
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "Activities",
                type: "rowversion",
                rowVersion: true,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "Trainings");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "TrainingParts");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "TrainingGroups");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "TrainingAgeGroups");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "TournamentTeams");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "TournamentSpecialTasks");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "Tournaments");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "TournamentMatchTaskCompletions");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "TournamentMatches");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "TestResults");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "TestDefinitions");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "TestColourRanges");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "TeamStatMetricTemplates");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "Teams");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "TeamMembers");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "Tags");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "StatTrackers");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "StatTrackerParticipants");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "StatTrackerMetrics");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "StatTrackerEntries");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "Seasons");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "RoleRequests");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "RepeatingPatterns");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "Places");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "Members");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "MatchLineups");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "LineupSlots");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "LineupRosters");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "LineupFormations");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "GradeOptions");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "FormationTemplateSlots");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "FormationTemplates");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "Equipments");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "Clubs");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "AppointmentTestDefinitions");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "Appointments");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "AppointmentRatings");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "AgeGroups");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "ActivityTags");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "ActivityMedium");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "ActivityEquipments");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "ActivityAgeGroups");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "Activities");
        }
    }
}
