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
                name: "TrainingParts",
                columns: table => new
                {
                    TrainingPartId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", nullable: true),
                    Description = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrainingParts", x => x.TrainingPartId);
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
                    Place = table.Column<string>(type: "TEXT", nullable: true),
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
                name: "TrainingPartActivities",
                columns: table => new
                {
                    TrainingPartId = table.Column<int>(type: "INTEGER", nullable: false),
                    ActivityId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrainingPartActivities", x => new { x.TrainingPartId, x.ActivityId });
                    table.ForeignKey(
                        name: "FK_TrainingPartActivities_Activities_ActivityId",
                        column: x => x.ActivityId,
                        principalTable: "Activities",
                        principalColumn: "ActivityId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TrainingPartActivities_TrainingParts_TrainingPartId",
                        column: x => x.TrainingPartId,
                        principalTable: "TrainingParts",
                        principalColumn: "TrainingPartId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TrainingTrainingParts",
                columns: table => new
                {
                    TrainingPartId = table.Column<int>(type: "INTEGER", nullable: false),
                    TrainingId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrainingTrainingParts", x => new { x.TrainingId, x.TrainingPartId });
                    table.ForeignKey(
                        name: "FK_TrainingTrainingParts_TrainingParts_TrainingPartId",
                        column: x => x.TrainingPartId,
                        principalTable: "TrainingParts",
                        principalColumn: "TrainingPartId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TrainingTrainingParts_Trainings_TrainingId",
                        column: x => x.TrainingId,
                        principalTable: "Trainings",
                        principalColumn: "TrainingId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Activities",
                columns: new[] { "ActivityId", "Description", "DurationMax", "DurationMin", "Name", "PersonsMax", "PersonsMin" },
                values: new object[,]
                {
                    { 1, "Děti se rozdělí do dvou družstev, děti se drží za pas, první v řadě je hlava draka, poslední je ocas draka, družstva stojí asi 10 metrů od sebe, na povel se snaží hlava draka chytit ocas draka protihráče", 10, 5, "Dračí zápasy", null, 4 },
                    { 2, "Čert má z rozlišováku připevněný ocas a snaží se všechny ostatní hráče polapit. Pokud někoho chytne, jde mimo hřiště.Hráči se snaží vzít čertovy ocas a osvobodit tak již chycené hráče. Po osvobození hráčů hra končí a stává se čertem hráč, který vzal čertovy ocas.", 15, 5, "Čertovská honička", null, 5 },
                    { 3, "", 20, 10, "Florbal 3x3", 12, 6 },
                    { 4, "Všichni mají florbalky. Každá ovečka má míček. Vlk se postaví do základní pozice na druhé straně hřiště. Po zahájení hry se saží chytit ovečku tak, že ji vezme florbalově čistě míček. Nesmí se vracet ve směru pohybu. Ovečka , která přišla o míček se stává vlkem, Po chycení všech oveček hra končí.", 15, 5, "Na ovečky a vlky s florbalkou a míčkem", null, 5 },
                    { 5, "", 10, 3, "Mírný klus", null, 1 },
                    { 6, "Také nazývané jako protlačování, slouží k lepší práci a flexibilitě kotníků a pomáhá nám ve startovací fázi běhu.  Nejprve cvik provádíme na místě, posléze s nepatrným posunem vpřed. Špičky necháváme zcela na místě, pracuje pouze pata, a to střídavým rychlým a dynamickým pohybem směrem vzhůru. Při tomto pohybu se nám jedno koleno dostane do popředí a druhým se snažíme protlačovat vzad. Horní část těla a boky držíme zpevněné s přímým pohledem vpřed. Ruce pokrčíme jako při běhu a pomáháme si s nimi udávat rychlost celého pohybu.", 3, 1, "Běžecká abeceda - lifting - pata špička", null, 1 },
                    { 7, "Skipping nazýváme stejně dynamický pohyb jako u liftingu s tím rozdílem, že se nám do pohybu zapojí kolena. Ty se snažíme dostat co nejvýše nejlépe tak, aby stehno bylo ve vodorovné poloze. Není to však nutností. Hlavním požadavkem u tohoto cviku je dynamika. Dbát musíme na držení horní části těla, která by se neměla dostat do záklonu, ale spíše do mírného předklonu.", 3, 1, "Běžecká abeceda - skiping - vysoká kolena", null, 1 },
                    { 8, "Tento cvik řadíme mezi ty, díky kterým se náš běh zrychlí a zefektivní. A bude také dynamičtější a zlepší se rychlost našich reakci při případném nuceném neočekávaném zastavení. Lýtka zvedáme směrem nahoru až k horní části stehen a hýždím, jako bychom se chtěli sami nakopnout. Pohyb musí být dynamický a rytmický. Tělo se snažíme mít po celou dobu zpevněné a narovnané. Vyšší úroveň můžeme nasadit například kombinací skippingu a zakopávání po 4 opakováních.", 3, 1, "Běžecká abeceda - zakopávaní", null, 1 },
                    { 9, "Koordinačně nejtěžší cvik, který je ve finále a dobrém provedení skvělou hrou. Malými krůčky do boku střídá vždy zadní noha tu přední a střídavě ji křižuje vždy dopředu a dozadu. Paže rozpažíme, hlavu otočíme ve směru běhu a při dobrém provedení cítíme, jak se nám trup krásně protahuje, zatímco nohy nám hrají hru na kočkovanou a honí jedna druhou. Nesmíme zapomenout směr běhu po nějakém čase vystřídat.", 3, 1, "Běžecká abeceda - běh stranou ", null, 1 },
                    { 10, "Ruce dáme v bok, vybereme si pravou nebo levou stranu a krokujeme. Postupně zrychlujeme, až do úplných skoků kdy se naše kotníky sílou dynamiky skoro jakoby spojí. Po sérii 10 skoků opakujeme na druhou stranu. Získáme díky tomu lepší odrazovou sílu a procvičujeme také koordinaci.", 3, 1, "Běžecká abeceda - skoky stranou", null, 1 },
                    { 11, "Jelení skoky jsou nedílnou součástí a po sérii dynamických cviků nám tento napomáhá ke zvýšení běžeckého rozsahu a prevenci proti natrhnutí svalů. Dlouhé kroky postupně zrychlete, skoro až na běh při kterém odrazovou nohu napněte v kolenou a neodrazovou naopak vystřelte kolenem dopředu. Tento cvik je pro začátečníky nejsložitější, proto dbejte na precizním provedení a raději začněte pomalu skoro kroky než hned úplnými jeleními skoky. Pažemi pohybujeme podobně jako u běhu s možností úplného natažení ruky před sebe.", 3, 1, "Běžecká abeceda - jelení skoky", null, 1 }
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
                    { 5, 21 },
                    { 5, 23 },
                    { 5, 24 },
                    { 5, 37 },
                    { 5, 49 },
                    { 5, 50 },
                    { 5, 51 },
                    { 6, 22 },
                    { 6, 32 },
                    { 6, 49 },
                    { 6, 50 },
                    { 6, 51 },
                    { 7, 22 },
                    { 7, 32 },
                    { 7, 49 },
                    { 7, 50 },
                    { 7, 51 },
                    { 8, 22 },
                    { 8, 32 },
                    { 8, 49 },
                    { 8, 50 },
                    { 8, 51 },
                    { 9, 22 },
                    { 9, 32 },
                    { 9, 49 },
                    { 9, 50 },
                    { 9, 51 },
                    { 10, 22 },
                    { 10, 32 },
                    { 10, 49 },
                    { 10, 50 },
                    { 10, 51 },
                    { 11, 22 },
                    { 11, 32 },
                    { 11, 49 },
                    { 11, 50 },
                    { 11, 51 }
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
                name: "IX_TrainingPartActivities_ActivityId",
                table: "TrainingPartActivities",
                column: "ActivityId");

            migrationBuilder.CreateIndex(
                name: "IX_TrainingTrainingParts_TrainingPartId",
                table: "TrainingTrainingParts",
                column: "TrainingPartId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ActivityTags");

            migrationBuilder.DropTable(
                name: "TrainingPartActivities");

            migrationBuilder.DropTable(
                name: "TrainingTrainingParts");

            migrationBuilder.DropTable(
                name: "Tags");

            migrationBuilder.DropTable(
                name: "Activities");

            migrationBuilder.DropTable(
                name: "TrainingParts");

            migrationBuilder.DropTable(
                name: "Trainings");
        }
    }
}
