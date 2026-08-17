using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FloorballTraining.Plugins.EFCoreSqlServer.Migrations
{
    /// <inheritdoc />
    public partial class AddStatTrackerMatchInfo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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

            migrationBuilder.AddColumn<int>(
                name: "MatchPartDurationMinutes",
                table: "StatTrackers",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MatchPeriodCount",
                table: "StatTrackers",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OpponentName",
                table: "StatTrackers",
                type: "nvarchar(120)",
                maxLength: 120,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AwayScore",
                table: "StatTrackers");

            migrationBuilder.DropColumn(
                name: "HomeScore",
                table: "StatTrackers");

            migrationBuilder.DropColumn(
                name: "MatchPartDurationMinutes",
                table: "StatTrackers");

            migrationBuilder.DropColumn(
                name: "MatchPeriodCount",
                table: "StatTrackers");

            migrationBuilder.DropColumn(
                name: "OpponentName",
                table: "StatTrackers");
        }
    }
}
