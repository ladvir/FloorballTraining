using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace FloorballTraining.Plugins.EFCoreSqlServer.Migrations
{
    /// <inheritdoc />
    public partial class AddPlayerSkills : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SkillCategories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Position = table.Column<int>(type: "int", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SkillCategories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Skills",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SkillCategoryId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Skills", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Skills_SkillCategories_SkillCategoryId",
                        column: x => x.SkillCategoryId,
                        principalTable: "SkillCategories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PlayerSkillRatings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MemberId = table.Column<int>(type: "int", nullable: false),
                    SkillId = table.Column<int>(type: "int", nullable: false),
                    Grade = table.Column<int>(type: "int", nullable: false),
                    TargetGrade = table.Column<int>(type: "int", nullable: true),
                    Recommendation = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    RatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    RatedByAppUserId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlayerSkillRatings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlayerSkillRatings_Members_MemberId",
                        column: x => x.MemberId,
                        principalTable: "Members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PlayerSkillRatings_Skills_SkillId",
                        column: x => x.SkillId,
                        principalTable: "Skills",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "SkillCategories",
                columns: new[] { "Id", "Name", "Position", "SortOrder" },
                values: new object[,]
                {
                    { 1, "Práce s míčkem", 0, 1 },
                    { 2, "Zakončení", 0, 2 },
                    { 3, "Pohyb bez míčku", 0, 3 },
                    { 4, "Pohyb na hřišti", 0, 4 },
                    { 5, "Obranné činnosti", 0, 5 },
                    { 6, "Kondice", 0, 6 },
                    { 7, "Postoj a pohyb", 1, 1 },
                    { 8, "Zákroky", 1, 2 },
                    { 9, "Rozehrávka", 1, 3 },
                    { 10, "Komunikace a organizace obrany", 1, 4 },
                    { 11, "Kondice", 1, 5 }
                });

            migrationBuilder.InsertData(
                table: "Skills",
                columns: new[] { "Id", "Name", "SkillCategoryId", "SortOrder" },
                values: new object[,]
                {
                    { 101, "Vedení míčku", 1, 1 },
                    { 102, "Zpracování a první dotek", 1, 2 },
                    { 103, "Kontrola míčku", 1, 3 },
                    { 104, "Obcházení soupeře", 1, 4 },
                    { 105, "Změna směru", 1, 5 },
                    { 201, "Střelba", 2, 1 },
                    { 202, "Přesnost střely", 2, 2 },
                    { 203, "Zakončení z první", 2, 3 },
                    { 204, "Tečování a dorážka", 2, 4 },
                    { 205, "Zakončení pod tlakem", 2, 5 },
                    { 301, "Náběhy", 3, 1 },
                    { 302, "Vytváření prostoru", 3, 2 },
                    { 303, "Uvolňování se pro přihrávku", 3, 3 },
                    { 304, "Změna tempa", 3, 4 },
                    { 305, "Načasování pohybu", 3, 5 },
                    { 401, "Orientace", 4, 1 },
                    { 402, "Práce v prostoru", 4, 2 },
                    { 403, "Přechod útok/obrana", 4, 3 },
                    { 404, "Poziční hra", 4, 4 },
                    { 405, "Rozhodování", 4, 5 },
                    { 501, "Odebírání míčku", 5, 1 },
                    { 502, "Presink", 5, 2 },
                    { 503, "Osobní obrana", 5, 3 },
                    { 504, "Souboje", 5, 4 },
                    { 505, "Blokování střel", 5, 5 },
                    { 601, "Rychlost", 6, 1 },
                    { 602, "Akcelerace", 6, 2 },
                    { 603, "Vytrvalost", 6, 3 },
                    { 604, "Síla", 6, 4 },
                    { 605, "Obratnost", 6, 5 },
                    { 606, "Koordinace", 6, 6 },
                    { 701, "Základní postoj", 7, 1 },
                    { 702, "Přesuny", 7, 2 },
                    { 703, "Práce nohou", 7, 3 },
                    { 704, "Správné postavení vůči střele", 7, 4 },
                    { 705, "Reakce", 7, 5 },
                    { 801, "Chytání", 8, 1 },
                    { 802, "Vyrážení", 8, 2 },
                    { 803, "Zákroky na čáře", 8, 3 },
                    { 804, "Zákroky 1 na 1", 8, 4 },
                    { 805, "Zákroky na vysoké míče", 8, 5 },
                    { 901, "Výhoz a vyhození po zákroku", 9, 1 },
                    { 902, "Přihrávka", 9, 2 },
                    { 903, "Rozehrávka pod tlakem", 9, 3 },
                    { 904, "Založení útoku", 9, 4 },
                    { 1001, "Komunikace se spoluhráči", 10, 1 },
                    { 1002, "Řízení obrany", 10, 2 },
                    { 1003, "Organizace standardních situací", 10, 3 },
                    { 1004, "Čtení hry", 10, 4 },
                    { 1101, "Rychlost", 11, 1 },
                    { 1102, "Výbušnost", 11, 2 },
                    { 1103, "Síla", 11, 3 },
                    { 1104, "Koordinace", 11, 4 },
                    { 1105, "Flexibilita", 11, 5 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_PlayerSkillRatings_MemberId",
                table: "PlayerSkillRatings",
                column: "MemberId");

            migrationBuilder.CreateIndex(
                name: "IX_PlayerSkillRatings_MemberId_SkillId_RatedAt",
                table: "PlayerSkillRatings",
                columns: new[] { "MemberId", "SkillId", "RatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_PlayerSkillRatings_SkillId",
                table: "PlayerSkillRatings",
                column: "SkillId");

            migrationBuilder.CreateIndex(
                name: "IX_SkillCategories_Position",
                table: "SkillCategories",
                column: "Position");

            migrationBuilder.CreateIndex(
                name: "IX_Skills_SkillCategoryId",
                table: "Skills",
                column: "SkillCategoryId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PlayerSkillRatings");

            migrationBuilder.DropTable(
                name: "Skills");

            migrationBuilder.DropTable(
                name: "SkillCategories");
        }
    }
}
