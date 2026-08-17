using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FloorballTraining.Plugins.EFCoreSqlServer.Migrations
{
    /// <inheritdoc />
    public partial class FixCollationDataMigration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Re-run data migrations that failed due to collation conflict
            migrationBuilder.Sql(@"
                UPDATE m
                SET m.AppUserId = u.Id
                FROM Members m
                INNER JOIN AspNetUsers u ON m.Email COLLATE SQL_Latin1_General_CP1_CI_AS = u.Email
                WHERE m.AppUserId IS NULL AND m.Email IS NOT NULL AND m.Email <> ''
            ");

            migrationBuilder.Sql(@"
                UPDATE m
                SET m.HasClubRoleCoach = 1
                FROM Members m
                WHERE m.HasClubRoleMainCoach = 1
                   OR EXISTS (SELECT 1 FROM TeamMembers tm WHERE tm.MemberId = m.Id AND tm.IsCoach = 1)
            ");

            migrationBuilder.Sql(@"
                UPDATE Clubs SET MaxRegistrationRole = 'User' WHERE MaxRegistrationRole IS NULL
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
