using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FloorballTraining.Plugins.EFCoreSqlServer.Migrations
{
    /// <inheritdoc />
    public partial class AllowMultipleHomeTrainingsPerDay : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_HomeTrainingLogs_MemberId_LoggedAt",
                table: "HomeTrainingLogs");

            migrationBuilder.CreateIndex(
                name: "IX_HomeTrainingLogs_MemberId_LoggedAt",
                table: "HomeTrainingLogs",
                columns: new[] { "MemberId", "LoggedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_HomeTrainingLogs_MemberId_LoggedAt",
                table: "HomeTrainingLogs");

            migrationBuilder.CreateIndex(
                name: "IX_HomeTrainingLogs_MemberId_LoggedAt",
                table: "HomeTrainingLogs",
                columns: new[] { "MemberId", "LoggedAt" },
                unique: true);
        }
    }
}
