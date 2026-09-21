using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FloorballTraining.Plugins.EFCoreSqlServer.Migrations
{
    /// <inheritdoc />
    public partial class AddOpponent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "OpponentId",
                table: "Appointments",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Opponents",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    ClubId = table.Column<int>(type: "int", nullable: false),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Opponents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Opponents_Clubs_ClubId",
                        column: x => x.ClubId,
                        principalTable: "Clubs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_OpponentId",
                table: "Appointments",
                column: "OpponentId");

            migrationBuilder.CreateIndex(
                name: "IX_Opponents_ClubId_Name",
                table: "Opponents",
                columns: new[] { "ClubId", "Name" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Appointments_Opponents_OpponentId",
                table: "Appointments",
                column: "OpponentId",
                principalTable: "Opponents",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Appointments_Opponents_OpponentId",
                table: "Appointments");

            migrationBuilder.DropTable(
                name: "Opponents");

            migrationBuilder.DropIndex(
                name: "IX_Appointments_OpponentId",
                table: "Appointments");

            migrationBuilder.DropColumn(
                name: "OpponentId",
                table: "Appointments");
        }
    }
}
