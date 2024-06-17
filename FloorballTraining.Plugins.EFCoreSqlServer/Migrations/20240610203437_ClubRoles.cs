using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FloorballTraining.Plugins.EFCoreSqlServer.Migrations
{
    /// <inheritdoc />
    public partial class ClubRoles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ClubRole",
                table: "Members");

            migrationBuilder.AddColumn<bool>(
                name: "HasClubRoleMainCoach",
                table: "Members",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "HasClubRoleManager",
                table: "Members",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "HasClubRoleOther",
                table: "Members",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "HasClubRoleSecretary",
                table: "Members",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "HasClubRoleMainCoach",
                table: "Members");

            migrationBuilder.DropColumn(
                name: "HasClubRoleManager",
                table: "Members");

            migrationBuilder.DropColumn(
                name: "HasClubRoleOther",
                table: "Members");

            migrationBuilder.DropColumn(
                name: "HasClubRoleSecretary",
                table: "Members");

            migrationBuilder.AddColumn<int>(
                name: "ClubRole",
                table: "Members",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }
    }
}
