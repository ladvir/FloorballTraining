using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace FloorballTraining.Plugins.EFCoreSqlServer.Migrations
{
    /// <inheritdoc />
    public partial class Goalies : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Activities",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PersonsMin = table.Column<int>(type: "int", nullable: false),
                    PersonsMax = table.Column<int>(type: "int", nullable: false),
                    GoaliesMin = table.Column<int>(type: "int", nullable: false),
                    GoaliesMax = table.Column<int>(type: "int", nullable: false),
                    DurationMin = table.Column<int>(type: "int", nullable: false),
                    DurationMax = table.Column<int>(type: "int", nullable: false),
                    Intensity = table.Column<int>(type: "int", nullable: false),
                    Difficulty = table.Column<int>(type: "int", nullable: false),
                    PlaceWidth = table.Column<int>(type: "int", nullable: false),
                    PlaceLength = table.Column<int>(type: "int", nullable: false),
                    Environment = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Activities", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AgeGroups",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AgeGroups", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Equipments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Equipments", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Places",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Width = table.Column<int>(type: "int", nullable: false),
                    Length = table.Column<int>(type: "int", nullable: false),
                    Environment = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Places", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Tags",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Color = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ParentTagId = table.Column<int>(type: "int", nullable: true),
                    IsTrainingGoal = table.Column<bool>(type: "bit", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tags", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Tags_Tags_ParentTagId",
                        column: x => x.ParentTagId,
                        principalTable: "Tags",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ActivityMedium",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ActivityId = table.Column<int>(type: "int", nullable: false),
                    Path = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    MediaType = table.Column<int>(type: "int", nullable: false),
                    Preview = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Data = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ActivityMedium", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ActivityMedium_Activities_ActivityId",
                        column: x => x.ActivityId,
                        principalTable: "Activities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ActivityAgeGroups",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ActivityId = table.Column<int>(type: "int", nullable: true),
                    AgeGroupId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ActivityAgeGroups", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ActivityAgeGroups_Activities_ActivityId",
                        column: x => x.ActivityId,
                        principalTable: "Activities",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ActivityAgeGroups_AgeGroups_AgeGroupId",
                        column: x => x.AgeGroupId,
                        principalTable: "AgeGroups",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ActivityEquipments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ActivityId = table.Column<int>(type: "int", nullable: false),
                    EquipmentId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ActivityEquipments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ActivityEquipments_Activities_ActivityId",
                        column: x => x.ActivityId,
                        principalTable: "Activities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ActivityEquipments_Equipments_EquipmentId",
                        column: x => x.EquipmentId,
                        principalTable: "Equipments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ActivityTags",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ActivityId = table.Column<int>(type: "int", nullable: true),
                    TagId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ActivityTags", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ActivityTags_Activities_ActivityId",
                        column: x => x.ActivityId,
                        principalTable: "Activities",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ActivityTags_Tags_TagId",
                        column: x => x.TagId,
                        principalTable: "Tags",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Trainings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Duration = table.Column<int>(type: "int", nullable: false),
                    PersonsMin = table.Column<int>(type: "int", nullable: false),
                    PersonsMax = table.Column<int>(type: "int", nullable: false),
                    Intensity = table.Column<int>(type: "int", nullable: false),
                    Difficulty = table.Column<int>(type: "int", nullable: false),
                    CommentBefore = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CommentAfter = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PlaceId = table.Column<int>(type: "int", nullable: false),
                    TrainingGoal1Id = table.Column<int>(type: "int", nullable: true),
                    TrainingGoal2Id = table.Column<int>(type: "int", nullable: true),
                    TrainingGoal3Id = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Trainings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Trainings_Places_PlaceId",
                        column: x => x.PlaceId,
                        principalTable: "Places",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Trainings_Tags_TrainingGoal1Id",
                        column: x => x.TrainingGoal1Id,
                        principalTable: "Tags",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Trainings_Tags_TrainingGoal2Id",
                        column: x => x.TrainingGoal2Id,
                        principalTable: "Tags",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Trainings_Tags_TrainingGoal3Id",
                        column: x => x.TrainingGoal3Id,
                        principalTable: "Tags",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "TrainingAgeGroups",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TrainingId = table.Column<int>(type: "int", nullable: true),
                    AgeGroupId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrainingAgeGroups", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TrainingAgeGroups_AgeGroups_AgeGroupId",
                        column: x => x.AgeGroupId,
                        principalTable: "AgeGroups",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_TrainingAgeGroups_Trainings_TrainingId",
                        column: x => x.TrainingId,
                        principalTable: "Trainings",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "TrainingParts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Order = table.Column<int>(type: "int", nullable: false),
                    TrainingId = table.Column<int>(type: "int", nullable: false),
                    Duration = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrainingParts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TrainingParts_Trainings_TrainingId",
                        column: x => x.TrainingId,
                        principalTable: "Trainings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TrainingGroups",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PersonsMax = table.Column<int>(type: "int", nullable: false),
                    PersonsMin = table.Column<int>(type: "int", nullable: false),
                    ActivityId = table.Column<int>(type: "int", nullable: true),
                    TrainingPartId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrainingGroups", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TrainingGroups_Activities_ActivityId",
                        column: x => x.ActivityId,
                        principalTable: "Activities",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_TrainingGroups_TrainingParts_TrainingPartId",
                        column: x => x.TrainingPartId,
                        principalTable: "TrainingParts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Activities",
                columns: new[] { "Id", "Description", "Difficulty", "DurationMax", "DurationMin", "Environment", "GoaliesMax", "GoaliesMin", "Intensity", "Name", "PersonsMax", "PersonsMin", "PlaceLength", "PlaceWidth" },
                values: new object[,]
                {
                    { 1, "Děti se rozdělí do dvou družstev, děti se drží za pas, první v řadě je hlava draka, poslední je ocas draka, družstva stojí asi 10 metrů od sebe, na povel se snaží hlava draka chytit ocas draka protihráče", 0, 10, 5, 0, 3, 0, 0, "Dračí zápasy", 30, 4, 1, 1 },
                    { 2, "Čert má z rozlišováku připevněný ocas a snaží se všechny ostatní hráče polapit. Pokud někoho chytne, jde mimo hřiště.Hráči se snaží vzít čertovy ocas a osvobodit tak již chycené hráče. Po osvobození hráčů hra končí a stává se čertem hráč, který vzal čertovy ocas.", 0, 15, 5, 0, 3, 0, 1, "Čertovská honička", 30, 5, 1, 1 },
                    { 3, "", 2, 20, 10, 0, 3, 0, 2, "Florbal 3x3", 12, 6, 1, 1 },
                    { 4, "Všichni mají florbalky. Každá ovečka má míček. Vlk se postaví do základní pozice na druhé straně hřiště. Po zahájení hry se saží chytit ovečku tak, že ji vezme florbalově čistě míček. Nesmí se vracet ve směru pohybu. Ovečka, která přišla o míček se stává vlkem, Po chycení všech oveček hra končí.", 0, 15, 5, 0, 3, 0, 1, "Na ovečky a vlky s florbalkou a míčkem", 30, 15, 1, 1 },
                    { 5, "", 2, 10, 5, 0, 3, 0, 2, "Florbal 1x1", 10, 2, 1, 1 },
                    { 6, "", 2, 20, 10, 0, 3, 0, 2, "Florbal 2x2", 10, 4, 1, 1 },
                    { 7, "", 2, 20, 10, 0, 3, 0, 2, "Florbal 5x5", 30, 10, 1, 1 },
                    { 20, "Hráč si udělá z kloboučků kruh. Mezera mezi kloboučky alespoň 30 cm. Hráč stojí s míčkem uprostřed a postupně provádí florbalový dribling stále dokola.", 0, 10, 3, 0, 3, 0, 0, "Florbalový dribling v kruhu", 30, 1, 2, 2 }
                });

            migrationBuilder.InsertData(
                table: "AgeGroups",
                columns: new[] { "Id", "Description", "Name" },
                values: new object[,]
                {
                    { 1, "Kdokoliv", "Kdokoliv" },
                    { 7, "U7 - předpřípravka", "U7" },
                    { 9, "U9 - přípravka", "U9" },
                    { 11, "U11 - elévi", "U11" },
                    { 13, "U13 - ml. žáci", "U13" },
                    { 15, "U15 - st. žáci", "U15" },
                    { 17, "U17 - dorost", "U17" },
                    { 21, "U21 - junioři", "U21" },
                    { 23, "Dospělí", "Dospeli" }
                });

            migrationBuilder.InsertData(
                table: "Equipments",
                columns: new[] { "Id", "Name" },
                values: new object[,]
                {
                    { 1, "Rozlišovací dresy" },
                    { 2, "Kužely" },
                    { 3, "Skočky" },
                    { 4, "Žebřík" },
                    { 5, "Švihadlo" },
                    { 6, "Fotbalový míč" },
                    { 7, "Florbalové míčky" },
                    { 8, "Florbalová branka" },
                    { 9, "Florbalky" }
                });

            migrationBuilder.InsertData(
                table: "Places",
                columns: new[] { "Id", "Environment", "Length", "Name", "Width" },
                values: new object[,]
                {
                    { 1, 1, 40, "GMK", 17 },
                    { 2, 1, 60, "Komenda", 25 },
                    { 3, 1, 20, "TGM", 10 },
                    { 4, 2, 40, "Venkovní hřiště za Komendou", 20 },
                    { 5, 1, 3, "Domov", 3 }
                });

            migrationBuilder.InsertData(
                table: "Tags",
                columns: new[] { "Id", "Color", "IsTrainingGoal", "Name", "ParentTagId" },
                values: new object[] { 1, "#ffd254", true, "Zaměření tréninku", null });

            migrationBuilder.InsertData(
                table: "Tags",
                columns: new[] { "Id", "Color", "Name", "ParentTagId" },
                values: new object[,]
                {
                    { 4, "#0989c2", "Tréninková část", null },
                    { 5, "#d9980d", "Forma", null },
                    { 10, "#666666", "Vlastní", null }
                });

            migrationBuilder.InsertData(
                table: "ActivityAgeGroups",
                columns: new[] { "Id", "ActivityId", "AgeGroupId" },
                values: new object[,]
                {
                    { 1, 1, 11 },
                    { 2, 1, 7 },
                    { 3, 3, 11 },
                    { 4, 3, 7 },
                    { 5, 20, 11 }
                });

            migrationBuilder.InsertData(
                table: "Tags",
                columns: new[] { "Id", "Color", "IsTrainingGoal", "Name", "ParentTagId" },
                values: new object[,]
                {
                    { 6, "#17a258", true, "Tělesná průprava", 1 },
                    { 11, "#ffd254", true, "1 x 1", 1 },
                    { 12, "#ffd254", true, "2 x 2", 1 },
                    { 13, "#ffd254", true, "3 x 3", 1 },
                    { 14, "#ffd254", true, "4 x 4", 1 },
                    { 15, "#ffd254", true, "5 x 5", 1 },
                    { 16, "#ffd254", true, "2 x 3", 1 },
                    { 17, "#ffd254", true, "2 x 1", 1 },
                    { 18, "#27dbf5", true, "Brankář", 1 },
                    { 19, "#27dbf5", true, "Útočník", 1 },
                    { 20, "#27dbf5", true, "Obránce", 1 }
                });

            migrationBuilder.InsertData(
                table: "Tags",
                columns: new[] { "Id", "Color", "Name", "ParentTagId" },
                values: new object[,]
                {
                    { 21, "#0989c2", "Rozehřátí", 4 },
                    { 22, "#0989c2", "Rozcvička", 4 },
                    { 23, "#0989c2", "Hlavní část", 4 },
                    { 24, "#0989c2", "Protahování", 4 },
                    { 25, "#d9980d", "Hra", 5 },
                    { 27, "#d9980d", "Test", 5 },
                    { 28, "#d9980d", "Štafeta", 5 }
                });

            migrationBuilder.InsertData(
                table: "Tags",
                columns: new[] { "Id", "Color", "IsTrainingGoal", "Name", "ParentTagId" },
                values: new object[,]
                {
                    { 29, "#ffd254", true, "Střelba", 1 },
                    { 30, "#ffd254", true, "Přihrávka", 1 },
                    { 31, "#ffd254", true, "Vedení míčku", 1 },
                    { 32, "#17a258", true, "Ohebnost", 1 },
                    { 33, "#17a258", true, "Síla", 1 },
                    { 34, "#17a258", true, "Výbušnost", 1 },
                    { 35, "#ffd254", true, "Uvolňování", 1 },
                    { 36, "#17a258", true, "Rychlost", 1 },
                    { 37, "#e6e9eb", true, "Herní myšlení", 1 },
                    { 38, "#e6e9eb", true, "Spolupráce v týmu", 1 }
                });

            migrationBuilder.InsertData(
                table: "Tags",
                columns: new[] { "Id", "Color", "Name", "ParentTagId" },
                values: new object[] { 39, "#d9980d", "Výzva", 5 });

            migrationBuilder.InsertData(
                table: "Tags",
                columns: new[] { "Id", "Color", "IsTrainingGoal", "Name", "ParentTagId" },
                values: new object[,]
                {
                    { 40, "#ffd254", true, "Hokejový dribling", 1 },
                    { 41, "#ffd254", true, "Florbalový dribling", 1 }
                });

            migrationBuilder.InsertData(
                table: "ActivityTags",
                columns: new[] { "Id", "ActivityId", "TagId" },
                values: new object[,]
                {
                    { 1, 1, 31 },
                    { 2, 1, 35 },
                    { 3, 3, 31 },
                    { 4, 3, 35 },
                    { 5, 20, 35 },
                    { 6, 20, 41 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_ActivityAgeGroups_ActivityId",
                table: "ActivityAgeGroups",
                column: "ActivityId");

            migrationBuilder.CreateIndex(
                name: "IX_ActivityAgeGroups_AgeGroupId",
                table: "ActivityAgeGroups",
                column: "AgeGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_ActivityEquipments_ActivityId",
                table: "ActivityEquipments",
                column: "ActivityId");

            migrationBuilder.CreateIndex(
                name: "IX_ActivityEquipments_EquipmentId",
                table: "ActivityEquipments",
                column: "EquipmentId");

            migrationBuilder.CreateIndex(
                name: "IX_ActivityMedium_ActivityId",
                table: "ActivityMedium",
                column: "ActivityId");

            migrationBuilder.CreateIndex(
                name: "IX_ActivityTags_ActivityId",
                table: "ActivityTags",
                column: "ActivityId");

            migrationBuilder.CreateIndex(
                name: "IX_ActivityTags_TagId",
                table: "ActivityTags",
                column: "TagId");

            migrationBuilder.CreateIndex(
                name: "IX_Tags_ParentTagId",
                table: "Tags",
                column: "ParentTagId");

            migrationBuilder.CreateIndex(
                name: "IX_TrainingAgeGroups_AgeGroupId",
                table: "TrainingAgeGroups",
                column: "AgeGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_TrainingAgeGroups_TrainingId",
                table: "TrainingAgeGroups",
                column: "TrainingId");

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

            migrationBuilder.CreateIndex(
                name: "IX_Trainings_PlaceId",
                table: "Trainings",
                column: "PlaceId");

            migrationBuilder.CreateIndex(
                name: "IX_Trainings_TrainingGoal1Id",
                table: "Trainings",
                column: "TrainingGoal1Id");

            migrationBuilder.CreateIndex(
                name: "IX_Trainings_TrainingGoal2Id",
                table: "Trainings",
                column: "TrainingGoal2Id");

            migrationBuilder.CreateIndex(
                name: "IX_Trainings_TrainingGoal3Id",
                table: "Trainings",
                column: "TrainingGoal3Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ActivityAgeGroups");

            migrationBuilder.DropTable(
                name: "ActivityEquipments");

            migrationBuilder.DropTable(
                name: "ActivityMedium");

            migrationBuilder.DropTable(
                name: "ActivityTags");

            migrationBuilder.DropTable(
                name: "TrainingAgeGroups");

            migrationBuilder.DropTable(
                name: "TrainingGroups");

            migrationBuilder.DropTable(
                name: "Equipments");

            migrationBuilder.DropTable(
                name: "AgeGroups");

            migrationBuilder.DropTable(
                name: "Activities");

            migrationBuilder.DropTable(
                name: "TrainingParts");

            migrationBuilder.DropTable(
                name: "Trainings");

            migrationBuilder.DropTable(
                name: "Places");

            migrationBuilder.DropTable(
                name: "Tags");
        }
    }
}
