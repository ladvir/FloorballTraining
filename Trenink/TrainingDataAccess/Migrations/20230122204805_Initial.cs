using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace TrainingDataAccess.Migrations
{
    /// <inheritdoc />
    public partial class Initial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Activities",
                columns: table => new
                {
                    ActivityId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Description = table.Column<string>(type: "TEXT", nullable: false),
                    PersonsMin = table.Column<int>(type: "INTEGER", nullable: true),
                    PersonsMax = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Activities", x => x.ActivityId);
                });

            migrationBuilder.CreateTable(
                name: "Tags",
                columns: table => new
                {
                    TagId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", nullable: true),
                    ParentTagId = table.Column<int>(type: "INTEGER", nullable: true),
                    Color = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tags", x => x.TagId);
                    table.ForeignKey(
                        name: "FK_Tags_Tags_ParentTagId",
                        column: x => x.ParentTagId,
                        principalTable: "Tags",
                        principalColumn: "TagId");
                });

            migrationBuilder.CreateTable(
                name: "ActivityTag",
                columns: table => new
                {
                    ActivitiesActivityId = table.Column<int>(type: "INTEGER", nullable: false),
                    TagsTagId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ActivityTag", x => new { x.ActivitiesActivityId, x.TagsTagId });
                    table.ForeignKey(
                        name: "FK_ActivityTag_Activities_ActivitiesActivityId",
                        column: x => x.ActivitiesActivityId,
                        principalTable: "Activities",
                        principalColumn: "ActivityId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ActivityTag_Tags_TagsTagId",
                        column: x => x.TagsTagId,
                        principalTable: "Tags",
                        principalColumn: "TagId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Tags",
                columns: new[] { "TagId", "Color", "Name", "ParentTagId" },
                values: new object[,]
                {
                    { 1, "#ffd254", "Florbalový dril", null },
                    { 3, "#27dbf5", "Hráč", null },
                    { 4, "#0989c2", "Tréninková část", null },
                    { 5, "#d9980d", "Forma", null },
                    { 6, "#17a258", "Tělesná průprava", null },
                    { 7, "#e6e9eb", "Ostatní", null },
                    { 8, "#ff9102", "Vybavení", null },
                    { 9, "#2196f3", "Hráčská kategorie", null },
                    { 10, "#666666", "Vlastní", null },
                    { 11, "#ffd254", "1 x 1", 1 },
                    { 12, "#ffd254", "2 x 2", 1 },
                    { 13, "#ffd254", "3 x 3", 1 },
                    { 14, "#ffd254", "4 x 4", 1 },
                    { 15, "#ffd254", "5 x 5", 1 },
                    { 16, "#ffd254", "2 x 3", 1 },
                    { 17, "#ffd254", "2 x 1", 1 },
                    { 18, "#27dbf5", "Brankář", 3 },
                    { 19, "#27dbf5", "Útočník", 3 },
                    { 20, "#27dbf5", "Obránce", 3 },
                    { 21, "#0989c2", "Rozehřátí", 4 },
                    { 22, "#0989c2", "Rozcvička", 4 },
                    { 23, "#0989c2", "Dril", 4 },
                    { 24, "#0989c2", "Protahování", 4 },
                    { 25, "#d9980d", "Hra", 5 },
                    { 26, "#d9980d", "Florbal", 5 },
                    { 27, "#d9980d", "Test", 5 },
                    { 28, "#d9980d", "Štafeta", 5 },
                    { 29, "#ffd254", "Střelba", 1 },
                    { 30, "#ffd254", "Přihrávka", 1 },
                    { 31, "#ffd254", "Vedení míčku", 1 },
                    { 32, "#17a258", "Ohebnost", 6 },
                    { 33, "#17a258", "Síla", 6 },
                    { 34, "#17a258", "Výbušnost", 6 },
                    { 35, "#ffd254", "Uvolňování", 1 },
                    { 36, "#17a258", "Rychlost", 6 },
                    { 37, "#e6e9eb", "Herní myšlení", 7 },
                    { 38, "#e6e9eb", "Spolupráce v týmu", 7 },
                    { 39, "#ff9102", "Florbalové míčky", 8 },
                    { 40, "#ff9102", "Florbalová branka", 8 },
                    { 41, "#ff9102", "Rozlišovací dresy", 8 },
                    { 42, "#ff9102", "Kužely", 8 },
                    { 43, "#ff9102", "Skočky", 8 },
                    { 44, "#ff9102", "Žebřík", 8 },
                    { 45, "#ff9102", "Švihadlo", 8 },
                    { 46, "#ff9102", "Fotbalový míč", 8 },
                    { 47, "#2196f3", "U7 - předpřípravka", 9 },
                    { 48, "#2196f3", "U9 - přípravka", 9 },
                    { 49, "#2196f3", "U11 - elévi", 9 },
                    { 50, "#2196f3", "U13 - ml. žáci", 9 },
                    { 51, "#2196f3", "U15 - st. žáci", 9 },
                    { 52, "#2196f3", "U17 - dorost", 9 },
                    { 53, "#2196f3", "U21 - junioři ", 9 },
                    { 54, "#2196f3", "Muži", 9 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_ActivityTag_TagsTagId",
                table: "ActivityTag",
                column: "TagsTagId");

            migrationBuilder.CreateIndex(
                name: "IX_Tags_ParentTagId",
                table: "Tags",
                column: "ParentTagId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ActivityTag");

            migrationBuilder.DropTable(
                name: "Activities");

            migrationBuilder.DropTable(
                name: "Tags");
        }
    }
}
