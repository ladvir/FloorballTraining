using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FloorballTraining.Plugins.EFCoreSqlServer.Migrations
{
    /// <inheritdoc />
    public partial class Brankar3 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "GoaliesMax",
                table: "Trainings",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "GoaliesMin",
                table: "Trainings",
                type: "int",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "GoaliesMax",
                table: "Trainings");

            migrationBuilder.DropColumn(
                name: "GoaliesMin",
                table: "Trainings");
        }
    }
}
