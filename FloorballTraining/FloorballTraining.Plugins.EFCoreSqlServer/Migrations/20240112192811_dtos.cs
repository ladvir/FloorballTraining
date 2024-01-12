using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FloorballTraining.Plugins.EFCoreSqlServer.Migrations
{
    /// <inheritdoc />
    public partial class dtos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TrainingGroups_ActivityId",
                table: "TrainingGroups");

            migrationBuilder.CreateIndex(
                name: "IX_TrainingGroups_ActivityId",
                table: "TrainingGroups",
                column: "ActivityId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TrainingGroups_ActivityId",
                table: "TrainingGroups");

            migrationBuilder.CreateIndex(
                name: "IX_TrainingGroups_ActivityId",
                table: "TrainingGroups",
                column: "ActivityId",
                unique: true,
                filter: "[ActivityId] IS NOT NULL");
        }
    }
}
