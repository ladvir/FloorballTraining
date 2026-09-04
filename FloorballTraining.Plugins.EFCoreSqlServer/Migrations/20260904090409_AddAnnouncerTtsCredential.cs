using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FloorballTraining.Plugins.EFCoreSqlServer.Migrations
{
    /// <inheritdoc />
    public partial class AddAnnouncerTtsCredential : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AnnouncerTtsCredentials",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    Region = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    EncryptedApiKey = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    KeyLast4 = table.Column<string>(type: "nvarchar(4)", maxLength: 4, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastValidatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AnnouncerTtsCredentials", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AnnouncerTtsCredentials_UserId",
                table: "AnnouncerTtsCredentials",
                column: "UserId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AnnouncerTtsCredentials");
        }
    }
}
