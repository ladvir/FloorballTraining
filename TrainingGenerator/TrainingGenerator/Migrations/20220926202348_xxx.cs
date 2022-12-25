using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TrainingGenerator.Migrations
{
    public partial class xxx : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsCathegoryAdult",
                table: "Training",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsCathegoryU11",
                table: "Training",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsCathegoryU13",
                table: "Training",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsCathegoryU15",
                table: "Training",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsCathegoryU17",
                table: "Training",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsCathegoryU21",
                table: "Training",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsCathegoryU7",
                table: "Training",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsCathegoryU9",
                table: "Training",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsCathegoryAdult",
                table: "Activity",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsCathegoryU11",
                table: "Activity",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsCathegoryU13",
                table: "Activity",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsCathegoryU15",
                table: "Activity",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsCathegoryU17",
                table: "Activity",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsCathegoryU21",
                table: "Activity",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsCathegoryU7",
                table: "Activity",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsCathegoryU9",
                table: "Activity",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsCathegoryAdult",
                table: "Training");

            migrationBuilder.DropColumn(
                name: "IsCathegoryU11",
                table: "Training");

            migrationBuilder.DropColumn(
                name: "IsCathegoryU13",
                table: "Training");

            migrationBuilder.DropColumn(
                name: "IsCathegoryU15",
                table: "Training");

            migrationBuilder.DropColumn(
                name: "IsCathegoryU17",
                table: "Training");

            migrationBuilder.DropColumn(
                name: "IsCathegoryU21",
                table: "Training");

            migrationBuilder.DropColumn(
                name: "IsCathegoryU7",
                table: "Training");

            migrationBuilder.DropColumn(
                name: "IsCathegoryU9",
                table: "Training");

            migrationBuilder.DropColumn(
                name: "IsCathegoryAdult",
                table: "Activity");

            migrationBuilder.DropColumn(
                name: "IsCathegoryU11",
                table: "Activity");

            migrationBuilder.DropColumn(
                name: "IsCathegoryU13",
                table: "Activity");

            migrationBuilder.DropColumn(
                name: "IsCathegoryU15",
                table: "Activity");

            migrationBuilder.DropColumn(
                name: "IsCathegoryU17",
                table: "Activity");

            migrationBuilder.DropColumn(
                name: "IsCathegoryU21",
                table: "Activity");

            migrationBuilder.DropColumn(
                name: "IsCathegoryU7",
                table: "Activity");

            migrationBuilder.DropColumn(
                name: "IsCathegoryU9",
                table: "Activity");
        }
    }
}
