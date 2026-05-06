using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FloorballTraining.Plugins.EFCoreSqlServer.Migrations
{
    /// <inheritdoc />
    public partial class AddStatTrackerPeriodAndScoreLog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AwayScore",
                table: "StatTrackers");

            migrationBuilder.DropColumn(
                name: "HomeScore",
                table: "StatTrackers");

            migrationBuilder.AddColumn<int>(
                name: "CurrentPeriod",
                table: "StatTrackers",
                type: "int",
                nullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "StatTrackerParticipantId",
                table: "StatTrackerEntries",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AlterColumn<int>(
                name: "StatTrackerMetricId",
                table: "StatTrackerEntries",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddColumn<int>(
                name: "Kind",
                table: "StatTrackerEntries",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Period",
                table: "StatTrackerEntries",
                type: "int",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CurrentPeriod",
                table: "StatTrackers");

            migrationBuilder.DropColumn(
                name: "Kind",
                table: "StatTrackerEntries");

            migrationBuilder.DropColumn(
                name: "Period",
                table: "StatTrackerEntries");

            migrationBuilder.AddColumn<int>(
                name: "AwayScore",
                table: "StatTrackers",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "HomeScore",
                table: "StatTrackers",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AlterColumn<int>(
                name: "StatTrackerParticipantId",
                table: "StatTrackerEntries",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "StatTrackerMetricId",
                table: "StatTrackerEntries",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);
        }
    }
}
