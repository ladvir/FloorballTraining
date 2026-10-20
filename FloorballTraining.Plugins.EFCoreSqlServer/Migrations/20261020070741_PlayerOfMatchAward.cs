using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FloorballTraining.Plugins.EFCoreSqlServer.Migrations
{
    /// <inheritdoc />
    public partial class PlayerOfMatchAward : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_XpCoachAwards_AppointmentId",
                table: "XpCoachAwards");

            migrationBuilder.CreateIndex(
                name: "IX_XpCoachAwards_AppointmentId",
                table: "XpCoachAwards",
                column: "AppointmentId",
                unique: true,
                filter: "[Type] IN (0, 3)");

            // Awards given so far as "player of training" on a match (AppointmentType 3) become PlayerOfMatch (3);
            // the next XP recompute re-derives their ledger rows under the new event type.
            migrationBuilder.Sql(@"UPDATE a SET a.[Type] = 3
FROM XpCoachAwards a JOIN Appointments p ON p.Id = a.AppointmentId
WHERE a.[Type] = 0 AND p.AppointmentType = 3");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_XpCoachAwards_AppointmentId",
                table: "XpCoachAwards");

            migrationBuilder.CreateIndex(
                name: "IX_XpCoachAwards_AppointmentId",
                table: "XpCoachAwards",
                column: "AppointmentId",
                unique: true,
                filter: "[Type] = 0");
        }
    }
}
