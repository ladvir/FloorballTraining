using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FloorballTraining.Plugins.EFCoreSqlServer.Migrations
{
    /// <inheritdoc />
    public partial class AddAppointmentTestDefinition : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AppointmentTestDefinitions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AppointmentId = table.Column<int>(type: "int", nullable: false),
                    TestDefinitionId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppointmentTestDefinitions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AppointmentTestDefinitions_Appointments_AppointmentId",
                        column: x => x.AppointmentId,
                        principalTable: "Appointments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AppointmentTestDefinitions_TestDefinitions_TestDefinitionId",
                        column: x => x.TestDefinitionId,
                        principalTable: "TestDefinitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AppointmentTestDefinitions_AppointmentId",
                table: "AppointmentTestDefinitions",
                column: "AppointmentId");

            migrationBuilder.CreateIndex(
                name: "IX_AppointmentTestDefinitions_AppointmentId_TestDefinitionId",
                table: "AppointmentTestDefinitions",
                columns: new[] { "AppointmentId", "TestDefinitionId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AppointmentTestDefinitions_TestDefinitionId",
                table: "AppointmentTestDefinitions",
                column: "TestDefinitionId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AppointmentTestDefinitions");
        }
    }
}
