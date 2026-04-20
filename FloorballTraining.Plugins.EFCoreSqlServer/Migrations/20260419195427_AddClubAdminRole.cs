using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FloorballTraining.Plugins.EFCoreSqlServer.Migrations
{
    /// <inheritdoc />
    public partial class AddClubAdminRole : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "HasClubRoleManager",
                table: "Members");

            migrationBuilder.DropColumn(
                name: "HasClubRoleSecretary",
                table: "Members");

            migrationBuilder.AddColumn<bool>(
                name: "HasClubRoleClubAdmin",
                table: "Members",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "HasClubRoleClubAdmin",
                table: "Members");

            migrationBuilder.AddColumn<bool>(
                name: "HasClubRoleManager",
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
    }
}
