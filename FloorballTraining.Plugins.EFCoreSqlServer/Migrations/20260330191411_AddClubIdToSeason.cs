using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FloorballTraining.Plugins.EFCoreSqlServer.Migrations
{
    /// <inheritdoc />
    public partial class AddClubIdToSeason : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ClubId",
                table: "Seasons",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Seasons_ClubId",
                table: "Seasons",
                column: "ClubId");

            migrationBuilder.AddForeignKey(
                name: "FK_Seasons_Clubs_ClubId",
                table: "Seasons",
                column: "ClubId",
                principalTable: "Clubs",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Seasons_Clubs_ClubId",
                table: "Seasons");

            migrationBuilder.DropIndex(
                name: "IX_Seasons_ClubId",
                table: "Seasons");

            migrationBuilder.DropColumn(
                name: "ClubId",
                table: "Seasons");
        }
    }
}
