using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FloorballTraining.Plugins.EFCoreSqlServer.Migrations
{
    /// <inheritdoc />
    public partial class AddStatTrackerLineupRef : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "MatchLineupId",
                table: "StatTrackers",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_StatTrackers_MatchLineupId",
                table: "StatTrackers",
                column: "MatchLineupId");

            migrationBuilder.AddForeignKey(
                name: "FK_StatTrackers_MatchLineups_MatchLineupId",
                table: "StatTrackers",
                column: "MatchLineupId",
                principalTable: "MatchLineups",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_StatTrackers_MatchLineups_MatchLineupId",
                table: "StatTrackers");

            migrationBuilder.DropIndex(
                name: "IX_StatTrackers_MatchLineupId",
                table: "StatTrackers");

            migrationBuilder.DropColumn(
                name: "MatchLineupId",
                table: "StatTrackers");
        }
    }
}
