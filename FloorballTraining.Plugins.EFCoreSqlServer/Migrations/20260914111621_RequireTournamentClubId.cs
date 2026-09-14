using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FloorballTraining.Plugins.EFCoreSqlServer.Migrations
{
    /// <inheritdoc />
    public partial class RequireTournamentClubId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Backfill orphaned tournaments (ClubId was nullable and leaked across clubs) before making
            // the column required: resolve via the creator's club membership, falling back to the
            // oldest club for rows whose creator has none (e.g. an Admin-created tournament).
            migrationBuilder.Sql(@"
                UPDATE trn
                SET trn.ClubId = mem.ClubId
                FROM Tournaments trn
                INNER JOIN Members mem ON mem.AppUserId COLLATE DATABASE_DEFAULT = trn.CreatedByUserId COLLATE DATABASE_DEFAULT
                WHERE trn.ClubId IS NULL AND mem.ClubId IS NOT NULL;

                UPDATE Tournaments
                SET ClubId = (SELECT TOP 1 Id FROM Clubs ORDER BY Id)
                WHERE ClubId IS NULL;
            ");

            migrationBuilder.DropForeignKey(
                name: "FK_Tournaments_Clubs_ClubId",
                table: "Tournaments");

            migrationBuilder.AlterColumn<int>(
                name: "ClubId",
                table: "Tournaments",
                type: "int",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Tournaments_Clubs_ClubId",
                table: "Tournaments",
                column: "ClubId",
                principalTable: "Clubs",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Tournaments_Clubs_ClubId",
                table: "Tournaments");

            migrationBuilder.AlterColumn<int>(
                name: "ClubId",
                table: "Tournaments",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddForeignKey(
                name: "FK_Tournaments_Clubs_ClubId",
                table: "Tournaments",
                column: "ClubId",
                principalTable: "Clubs",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
