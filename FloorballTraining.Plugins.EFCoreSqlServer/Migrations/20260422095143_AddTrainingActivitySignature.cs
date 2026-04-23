using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FloorballTraining.Plugins.EFCoreSqlServer.Migrations
{
    /// <inheritdoc />
    public partial class AddTrainingActivitySignature : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ActivitySignature",
                table: "Trainings",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Trainings_ActivitySignature",
                table: "Trainings",
                column: "ActivitySignature");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Trainings_ActivitySignature",
                table: "Trainings");

            migrationBuilder.DropColumn(
                name: "ActivitySignature",
                table: "Trainings");
        }
    }
}
