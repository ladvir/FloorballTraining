using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace FloorballTraining.Plugins.EFCoreSqlServer.Migrations
{
    /// <inheritdoc />
    public partial class Init : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Activities",
                columns: table => new
                {
                    ActivityId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PersonsMin = table.Column<int>(type: "int", nullable: false),
                    PersonsMax = table.Column<int>(type: "int", nullable: false),
                    DurationMin = table.Column<int>(type: "int", nullable: false),
                    DurationMax = table.Column<int>(type: "int", nullable: false),
                    Intesity = table.Column<int>(type: "int", nullable: false),
                    Difficulty = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Activities", x => x.ActivityId);
                });

            migrationBuilder.CreateTable(
                name: "AgeGroups",
                columns: table => new
                {
                    AgeGroupId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AgeGroups", x => x.AgeGroupId);
                });

            migrationBuilder.CreateTable(
                name: "Equipments",
                columns: table => new
                {
                    EquipmentId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Equipments", x => x.EquipmentId);
                });

            migrationBuilder.CreateTable(
                name: "Tags",
                columns: table => new
                {
                    TagId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Color = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ParentTagId = table.Column<int>(type: "int", nullable: true),
                    IsTrainingGoal = table.Column<bool>(type: "bit", nullable: false)
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
                name: "ActivityMedium",
                columns: table => new
                {
                    ActivityMediaId = table.Column<int>(type: "int", nullable: false)
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
                    table.PrimaryKey("PK_ActivityMedium", x => x.ActivityMediaId);
                    table.ForeignKey(
                        name: "FK_ActivityMedium_Activities_ActivityId",
                        column: x => x.ActivityId,
                        principalTable: "Activities",
                        principalColumn: "ActivityId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ActivityAgeGroups",
                columns: table => new
                {
                    ActivityAgeGroupId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ActivityId = table.Column<int>(type: "int", nullable: false),
                    AgeGroupId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ActivityAgeGroups", x => x.ActivityAgeGroupId);
                    table.UniqueConstraint("AK_ActivityAgeGroups_ActivityId_AgeGroupId", x => new { x.ActivityId, x.AgeGroupId });
                    table.ForeignKey(
                        name: "FK_ActivityAgeGroups_Activities_ActivityId",
                        column: x => x.ActivityId,
                        principalTable: "Activities",
                        principalColumn: "ActivityId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ActivityAgeGroups_AgeGroups_AgeGroupId",
                        column: x => x.AgeGroupId,
                        principalTable: "AgeGroups",
                        principalColumn: "AgeGroupId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ActivityEquipments",
                columns: table => new
                {
                    ActivityEquipmentId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ActivityId = table.Column<int>(type: "int", nullable: false),
                    EquipmentId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ActivityEquipments", x => x.ActivityEquipmentId);
                    table.UniqueConstraint("AK_ActivityEquipments_ActivityEquipmentId_ActivityId_EquipmentId", x => new { x.ActivityEquipmentId, x.ActivityId, x.EquipmentId });
                    table.ForeignKey(
                        name: "FK_ActivityEquipments_Activities_ActivityId",
                        column: x => x.ActivityId,
                        principalTable: "Activities",
                        principalColumn: "ActivityId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ActivityEquipments_Equipments_EquipmentId",
                        column: x => x.EquipmentId,
                        principalTable: "Equipments",
                        principalColumn: "EquipmentId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ActivityTags",
                columns: table => new
                {
                    ActivityTagId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ActivityId = table.Column<int>(type: "int", nullable: false),
                    TagId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ActivityTags", x => x.ActivityTagId);
                    table.UniqueConstraint("AK_ActivityTags_ActivityId_TagId", x => new { x.ActivityId, x.TagId });
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
                name: "Trainings",
                columns: table => new
                {
                    TrainingId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Duration = table.Column<int>(type: "int", nullable: false),
                    PersonsMin = table.Column<int>(type: "int", nullable: false),
                    PersonsMax = table.Column<int>(type: "int", nullable: false),
                    Intesity = table.Column<int>(type: "int", nullable: false),
                    Difficulty = table.Column<int>(type: "int", nullable: false),
                    CommentBefore = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CommentAfter = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TrainingGoalId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Trainings", x => x.TrainingId);
                    table.ForeignKey(
                        name: "FK_Trainings_Tags_TrainingGoalId",
                        column: x => x.TrainingGoalId,
                        principalTable: "Tags",
                        principalColumn: "TagId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TrainingAgeGroups",
                columns: table => new
                {
                    TrainingAgeGroupId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TrainingId = table.Column<int>(type: "int", nullable: true),
                    AgeGroupId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrainingAgeGroups", x => x.TrainingAgeGroupId);
                    table.ForeignKey(
                        name: "FK_TrainingAgeGroups_AgeGroups_AgeGroupId",
                        column: x => x.AgeGroupId,
                        principalTable: "AgeGroups",
                        principalColumn: "AgeGroupId");
                    table.ForeignKey(
                        name: "FK_TrainingAgeGroups_Trainings_TrainingId",
                        column: x => x.TrainingId,
                        principalTable: "Trainings",
                        principalColumn: "TrainingId");
                });

            migrationBuilder.CreateTable(
                name: "TrainingParts",
                columns: table => new
                {
                    TrainingPartId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Duration = table.Column<int>(type: "int", nullable: false),
                    Order = table.Column<int>(type: "int", nullable: false),
                    TrainingId = table.Column<int>(type: "int", nullable: false)
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
                    TrainingGroupId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PersonsMax = table.Column<int>(type: "int", nullable: false),
                    PersonsMin = table.Column<int>(type: "int", nullable: false),
                    TrainingPartId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrainingGroups", x => x.TrainingGroupId);
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
                    TrainingGroupActivityId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TrainingGroupId = table.Column<int>(type: "int", nullable: false),
                    ActivityId = table.Column<int>(type: "int", nullable: false),
                    Duration = table.Column<int>(type: "int", nullable: false)
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
                columns: new[] { "ActivityId", "Description", "Difficulty", "DurationMax", "DurationMin", "Intesity", "Name", "PersonsMax", "PersonsMin" },
                values: new object[,]
                {
                    { 1, "Děti se rozdělí do dvou družstev, děti se drží za pas, první v řadě je hlava draka, poslední je ocas draka, družstva stojí asi 10 metrů od sebe, na povel se snaží hlava draka chytit ocas draka protihráče", 0, 10, 5, 0, "Dračí zápasy", 30, 4 },
                    { 2, "Čert má z rozlišováku připevněný ocas a snaží se všechny ostatní hráče polapit. Pokud někoho chytne, jde mimo hřiště.Hráči se snaží vzít čertovy ocas a osvobodit tak již chycené hráče. Po osvobození hráčů hra končí a stává se čertem hráč, který vzal čertovy ocas.", 0, 15, 5, 1, "Čertovská honička", 30, 5 },
                    { 3, "", 2, 20, 10, 2, "Florbal 3x3", 12, 6 },
                    { 4, "Všichni mají florbalky. Každá ovečka má míček. Vlk se postaví do základní pozice na druhé straně hřiště. Po zahájení hry se saží chytit ovečku tak, že ji vezme florbalově čistě míček. Nesmí se vracet ve směru pohybu. Ovečka, která přišla o míček se stává vlkem, Po chycení všech oveček hra končí.", 0, 15, 5, 1, "Na ovečky a vlky s florbalkou a míčkem", 30, 15 },
                    { 5, "", 2, 10, 5, 2, "Florbal 1x1", 10, 2 },
                    { 6, "", 2, 20, 10, 2, "Florbal 2x2", 10, 4 },
                    { 7, "", 2, 20, 10, 2, "Florbal 5x5", 30, 10 },
                    { 8, "", 2, 20, 10, 2, "A8", 12, 6 },
                    { 9, "", 2, 20, 10, 2, "Aktivita 9", 12, 6 },
                    { 10, "", 0, 20, 10, 0, "Aktivita 10", 12, 6 },
                    { 11, "", 2, 20, 10, 1, "Test 1", 12, 6 },
                    { 12, "", 0, 20, 20, 2, "Test 2", 16, 14 }
                });

            migrationBuilder.InsertData(
                table: "AgeGroups",
                columns: new[] { "AgeGroupId", "Description", "Name" },
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
                columns: new[] { "EquipmentId", "Name" },
                values: new object[,]
                {
                    { 1, "Rozlišovací dresy" },
                    { 2, "Kužely" },
                    { 3, "Skočky" },
                    { 4, "Žebřík" },
                    { 5, "Švihadlo" },
                    { 6, "Fotbalový míč" },
                    { 7, "Florbalové míčky" },
                    { 8, "Florbalová branka" }
                });

            migrationBuilder.InsertData(
                table: "Tags",
                columns: new[] { "TagId", "Color", "IsTrainingGoal", "Name", "ParentTagId" },
                values: new object[,]
                {
                    { 1, "#ffd254", true, "Zaměření tréninku", null },
                    { 4, "#0989c2", false, "Tréninková část", null },
                    { 5, "#d9980d", false, "Forma", null },
                    { 10, "#666666", false, "Vlastní", null },
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
                    { 20, "#27dbf5", true, "Obránce", 1 },
                    { 21, "#0989c2", false, "Rozehřátí", 4 },
                    { 22, "#0989c2", false, "Rozcvička", 4 },
                    { 23, "#0989c2", false, "Hlavní část", 4 },
                    { 24, "#0989c2", false, "Protahování", 4 },
                    { 25, "#d9980d", false, "Hra", 5 },
                    { 27, "#d9980d", false, "Test", 5 },
                    { 28, "#d9980d", false, "Štafeta", 5 },
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
                name: "IX_TrainingGroupActivities_ActivityId",
                table: "TrainingGroupActivities",
                column: "ActivityId");

            migrationBuilder.CreateIndex(
                name: "IX_TrainingGroupActivities_TrainingGroupId",
                table: "TrainingGroupActivities",
                column: "TrainingGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_TrainingGroups_TrainingPartId",
                table: "TrainingGroups",
                column: "TrainingPartId");

            migrationBuilder.CreateIndex(
                name: "IX_TrainingParts_TrainingId",
                table: "TrainingParts",
                column: "TrainingId");

            migrationBuilder.CreateIndex(
                name: "IX_Trainings_TrainingGoalId",
                table: "Trainings",
                column: "TrainingGoalId");
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
                name: "TrainingGroupActivities");

            migrationBuilder.DropTable(
                name: "Equipments");

            migrationBuilder.DropTable(
                name: "AgeGroups");

            migrationBuilder.DropTable(
                name: "Activities");

            migrationBuilder.DropTable(
                name: "TrainingGroups");

            migrationBuilder.DropTable(
                name: "TrainingParts");

            migrationBuilder.DropTable(
                name: "Trainings");

            migrationBuilder.DropTable(
                name: "Tags");
        }
    }
}
