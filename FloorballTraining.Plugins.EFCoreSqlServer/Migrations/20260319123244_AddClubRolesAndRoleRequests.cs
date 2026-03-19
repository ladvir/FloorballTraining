using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FloorballTraining.Plugins.EFCoreSqlServer.Migrations
{
    /// <inheritdoc />
    public partial class AddClubRolesAndRoleRequests : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AppUserId",
                table: "Members",
                type: "nvarchar(450)",
                maxLength: 450,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "HasClubRoleCoach",
                table: "Members",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "MaxRegistrationRole",
                table: "Clubs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "RoleRequests",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MemberId = table.Column<int>(type: "int", nullable: false),
                    RequestedRole = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ResolvedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ResolvedByUserId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RoleRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RoleRequests_Members_MemberId",
                        column: x => x.MemberId,
                        principalTable: "Members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Members_AppUserId",
                table: "Members",
                column: "AppUserId");

            migrationBuilder.CreateIndex(
                name: "IX_RoleRequests_MemberId",
                table: "RoleRequests",
                column: "MemberId");

            // Data migration: link existing Members to AppUsers by matching email
            migrationBuilder.Sql(@"
                UPDATE m
                SET m.AppUserId = u.Id
                FROM Members m
                INNER JOIN AspNetUsers u ON LOWER(m.Email) = LOWER(u.Email)
                WHERE m.AppUserId IS NULL AND m.Email IS NOT NULL AND m.Email <> ''
            ");

            // Data migration: set HasClubRoleCoach = 1 for members who are already coaches in TeamMembers
            migrationBuilder.Sql(@"
                UPDATE m
                SET m.HasClubRoleCoach = 1
                FROM Members m
                WHERE m.HasClubRoleMainCoach = 1
                   OR EXISTS (SELECT 1 FROM TeamMembers tm WHERE tm.MemberId = m.Id AND tm.IsCoach = 1)
            ");

            // Data migration: set default MaxRegistrationRole for existing clubs
            migrationBuilder.Sql(@"
                UPDATE Clubs SET MaxRegistrationRole = 'User' WHERE MaxRegistrationRole IS NULL
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RoleRequests");

            migrationBuilder.DropIndex(
                name: "IX_Members_AppUserId",
                table: "Members");

            migrationBuilder.DropColumn(
                name: "AppUserId",
                table: "Members");

            migrationBuilder.DropColumn(
                name: "HasClubRoleCoach",
                table: "Members");

            migrationBuilder.DropColumn(
                name: "MaxRegistrationRole",
                table: "Clubs");
        }
    }
}
