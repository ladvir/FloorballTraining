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
                    Description = table.Column<string>(type: "TEXT", nullable: true),
                    PersonsMin = table.Column<int>(type: "INTEGER", nullable: true),
                    PersonsMax = table.Column<int>(type: "INTEGER", nullable: true),
                    DurationMin = table.Column<int>(type: "INTEGER", nullable: true),
                    DurationMax = table.Column<int>(type: "INTEGER", nullable: true)
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
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    ParentTagId = table.Column<int>(type: "INTEGER", nullable: true),
                    Color = table.Column<string>(type: "TEXT", nullable: false)
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
                name: "Trainings",
                columns: table => new
                {
                    TrainingId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Description = table.Column<string>(type: "TEXT", nullable: true),
                    Duration = table.Column<int>(type: "INTEGER", nullable: false),
                    Persons = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Trainings", x => x.TrainingId);
                });

            migrationBuilder.CreateTable(
                name: "ActivityTags",
                columns: table => new
                {
                    ActivityId = table.Column<int>(type: "INTEGER", nullable: false),
                    TagId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ActivityTags", x => new { x.ActivityId, x.TagId });
                    table.ForeignKey(
                        name: "FK_ActivityTags_Activities_ActivityId",
                        column: x => x.ActivityId,
                        principalTable: "Activities",
                        principalColumn: "ActivityId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ActivityTags_Tags_TagId",
                        column: x => x.TagId,
                        principalTable: "Tags",
                        principalColumn: "TagId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TrainingParts",
                columns: table => new
                {
                    TrainingPartId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", nullable: true),
                    Description = table.Column<string>(type: "TEXT", nullable: true),
                    Duration = table.Column<int>(type: "INTEGER", nullable: false),
                    TrainingId = table.Column<int>(type: "INTEGER", nullable: false),
                    Order = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrainingParts", x => x.TrainingPartId);
                    table.ForeignKey(
                        name: "FK_TrainingParts_Trainings_TrainingId",
                        column: x => x.TrainingId,
                        principalTable: "Trainings",
                        principalColumn: "TrainingId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TrainingGroups",
                columns: table => new
                {
                    TrainingGroupId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", nullable: true),
                    TrainingPartId = table.Column<int>(type: "INTEGER", nullable: false),
                    ActivityId = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrainingGroups", x => x.TrainingGroupId);
                    table.ForeignKey(
                        name: "FK_TrainingGroups_Activities_ActivityId",
                        column: x => x.ActivityId,
                        principalTable: "Activities",
                        principalColumn: "ActivityId");
                    table.ForeignKey(
                        name: "FK_TrainingGroups_TrainingParts_TrainingPartId",
                        column: x => x.TrainingPartId,
                        principalTable: "TrainingParts",
                        principalColumn: "TrainingPartId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TrainingGroupActivities",
                columns: table => new
                {
                    TrainingGroupActivityId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ActivityId = table.Column<int>(type: "INTEGER", nullable: false),
                    TrainingGroupId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrainingGroupActivities", x => x.TrainingGroupActivityId);
                    table.ForeignKey(
                        name: "FK_TrainingGroupActivities_Activities_ActivityId",
                        column: x => x.ActivityId,
                        principalTable: "Activities",
                        principalColumn: "ActivityId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TrainingGroupActivities_TrainingGroups_TrainingGroupId",
                        column: x => x.TrainingGroupId,
                        principalTable: "TrainingGroups",
                        principalColumn: "TrainingGroupId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Activities",
                columns: new[] { "ActivityId", "Description", "DurationMax", "DurationMin", "Name", "PersonsMax", "PersonsMin" },
                values: new object[,]
                {
                    { 1, "Děti se rozdělí do dvou družstev, děti se drží za pas, první v řadě je hlava draka, poslední je ocas draka, družstva stojí asi 10 metrů od sebe, na povel se snaží hlava draka chytit ocas draka protihráče", null, 4, "Dračí zápasy", 10, 5 },
                    { 2, "Čert má z rozlišováku připevněný ocas a snaží se všechny ostatní hráče polapit. Pokud někoho chytne, jde mimo hřiště.Hráči se snaží vzít čertovy ocas a osvobodit tak již chycené hráče. Po osvobození hráčů hra končí a stává se čertem hráč, který vzal čertovy ocas.", null, 5, "Čertovská honička", 15, 5 },
                    { 3, "", 12, 6, "Florbal 3x3", 20, 10 },
                    { 4, "Všichni mají florbalky. Každá ovečka má míček. Vlk se postaví do základní pozice na druhé straně hřiště. Po zahájení hry se saží chytit ovečku tak, že ji vezme florbalově čistě míček. Nesmí se vracet ve směru pohybu. Ovečka , která přišla o míček se stává vlkem, Po chycení všech oveček hra končí.", null, 5, "Na ovečky a vlky s florbalkou a míčkem", 15, 5 },
                    { 101, "Střelci střílejí na branku. Před brankou jsou dorážeči. Pokud brankář nechytne míček, dorážeči se snaží co nejrychleji dorazit míček do branky. Cílem je naučit brankáře neodrážet před branku, ale míček hned rozehrát.", null, 5, "Bez dorážky", 10, 5 },
                    { 102, "2 útočníci běží společně do útoku a 1 obránce se je snaží dohnat a zabránit jim ve střele. Útočníci si mohou ale nemusí přihrát. Snaha o co nejpřimočarejš útok ve sprintu.", null, 5, "2 na 1 ve sprintu", 15, 10 },
                    { 103, "Dva týmy. Každý tým má svůj roh za brankou. První hráč vybíha podél mantinelu a sbíhá si do středu, kde dostane přihrávku od spoluhráče a střílí. Druhý hráč vybíha, dostane přihrávku a střílí.... Tým, který nejdříve dá předem určený počet gólů, vyhrává.", null, 7, "Střela po přihrávce z rohu", 15, 10 },
                    { 104, "Dva týmy. Každý tým má svůj roh za brankou. První hráč vybíha podél mantinelu a sbíhá si do středu trošku dále od branky, kde dostane přihrávku od spoluhráče a střílí. Druhý hráč vybíha, dostane přihrávku a střílí.... Tým, který nejdříve dá předem určený počet gólů, vyhrává.", null, 7, "Samostatný nájezd po přihrávce z rohu", 15, 10 }
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

            migrationBuilder.InsertData(
                table: "ActivityTags",
                columns: new[] { "ActivityId", "TagId" },
                values: new object[,]
                {
                    { 1, 21 },
                    { 1, 23 },
                    { 1, 25 },
                    { 1, 38 },
                    { 1, 49 },
                    { 1, 50 },
                    { 1, 51 },
                    { 1, 52 },
                    { 1, 53 },
                    { 1, 54 },
                    { 2, 21 },
                    { 2, 25 },
                    { 2, 38 },
                    { 2, 41 },
                    { 2, 49 },
                    { 2, 50 },
                    { 2, 51 },
                    { 3, 13 },
                    { 3, 18 },
                    { 3, 19 },
                    { 3, 20 },
                    { 3, 23 },
                    { 3, 25 },
                    { 3, 26 },
                    { 3, 38 },
                    { 3, 39 },
                    { 3, 40 },
                    { 3, 41 },
                    { 3, 49 },
                    { 3, 50 },
                    { 3, 51 },
                    { 4, 11 },
                    { 4, 19 },
                    { 4, 20 },
                    { 4, 21 },
                    { 4, 23 },
                    { 4, 25 },
                    { 4, 26 },
                    { 4, 31 },
                    { 4, 39 },
                    { 4, 49 },
                    { 4, 50 },
                    { 4, 51 },
                    { 101, 18 },
                    { 101, 19 },
                    { 101, 23 },
                    { 101, 26 },
                    { 101, 29 },
                    { 101, 34 },
                    { 101, 36 },
                    { 101, 39 },
                    { 101, 40 },
                    { 101, 49 },
                    { 101, 50 },
                    { 101, 51 },
                    { 101, 52 },
                    { 101, 53 },
                    { 101, 54 },
                    { 102, 11 },
                    { 102, 16 },
                    { 102, 18 },
                    { 102, 19 },
                    { 102, 20 },
                    { 102, 23 },
                    { 102, 26 },
                    { 102, 29 },
                    { 102, 30 },
                    { 102, 31 },
                    { 102, 34 },
                    { 102, 36 },
                    { 102, 37 },
                    { 102, 38 },
                    { 102, 39 },
                    { 102, 40 },
                    { 102, 46 },
                    { 102, 49 },
                    { 102, 50 },
                    { 102, 51 },
                    { 102, 52 },
                    { 102, 53 },
                    { 102, 54 },
                    { 103, 18 },
                    { 103, 19 },
                    { 103, 22 },
                    { 103, 23 },
                    { 103, 25 },
                    { 103, 26 },
                    { 103, 29 },
                    { 103, 30 },
                    { 103, 34 },
                    { 103, 36 },
                    { 103, 38 },
                    { 103, 39 },
                    { 103, 40 },
                    { 103, 49 },
                    { 103, 50 },
                    { 103, 51 },
                    { 103, 52 },
                    { 103, 53 },
                    { 103, 54 },
                    { 104, 18 },
                    { 104, 19 },
                    { 104, 22 },
                    { 104, 23 },
                    { 104, 25 },
                    { 104, 26 },
                    { 104, 29 },
                    { 104, 30 },
                    { 104, 34 },
                    { 104, 36 },
                    { 104, 38 },
                    { 104, 39 },
                    { 104, 40 },
                    { 104, 49 },
                    { 104, 50 },
                    { 104, 51 },
                    { 104, 52 },
                    { 104, 53 },
                    { 104, 54 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_ActivityTags_TagId",
                table: "ActivityTags",
                column: "TagId");

            migrationBuilder.CreateIndex(
                name: "IX_Tags_ParentTagId",
                table: "Tags",
                column: "ParentTagId");

            migrationBuilder.CreateIndex(
                name: "IX_TrainingGroupActivities_ActivityId",
                table: "TrainingGroupActivities",
                column: "ActivityId");

            migrationBuilder.CreateIndex(
                name: "IX_TrainingGroupActivities_TrainingGroupId",
                table: "TrainingGroupActivities",
                column: "TrainingGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_TrainingGroups_ActivityId",
                table: "TrainingGroups",
                column: "ActivityId");

            migrationBuilder.CreateIndex(
                name: "IX_TrainingGroups_TrainingPartId",
                table: "TrainingGroups",
                column: "TrainingPartId");

            migrationBuilder.CreateIndex(
                name: "IX_TrainingParts_TrainingId",
                table: "TrainingParts",
                column: "TrainingId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ActivityTags");

            migrationBuilder.DropTable(
                name: "TrainingGroupActivities");

            migrationBuilder.DropTable(
                name: "Tags");

            migrationBuilder.DropTable(
                name: "TrainingGroups");

            migrationBuilder.DropTable(
                name: "Activities");

            migrationBuilder.DropTable(
                name: "TrainingParts");

            migrationBuilder.DropTable(
                name: "Trainings");
        }
    }
}
