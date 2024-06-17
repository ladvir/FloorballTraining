using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FloorballTraining.Plugins.EFCoreSqlServer.Migrations
{
    /// <inheritdoc />
    public partial class TeamMember1 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TeamRole",
                table: "TeamMembers");

            migrationBuilder.AddColumn<bool>(
                name: "IsCoach",
                table: "TeamMembers",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsPlayer",
                table: "TeamMembers",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsCoach",
                table: "TeamMembers");

            migrationBuilder.DropColumn(
                name: "IsPlayer",
                table: "TeamMembers");

            migrationBuilder.AddColumn<int>(
                name: "TeamRole",
                table: "TeamMembers",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }
    }
}
