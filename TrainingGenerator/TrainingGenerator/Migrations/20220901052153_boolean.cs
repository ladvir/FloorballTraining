using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TrainingGenerator.Migrations
{
    public partial class boolean : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DurationMin",
                table: "TrainingActivity");

            migrationBuilder.DropColumn(
                name: "DurationMin",
                table: "Activity");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DurationMin",
                table: "TrainingActivity",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "DurationMin",
                table: "Activity",
                type: "INTEGER",
                nullable: true);
        }
    }
}
