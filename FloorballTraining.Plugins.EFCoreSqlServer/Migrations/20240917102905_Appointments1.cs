using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FloorballTraining.Plugins.EFCoreSqlServer.Migrations
{
    /// <inheritdoc />
    public partial class Appointments1 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Appointments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Start = table.Column<DateTime>(type: "datetime2", nullable: false),
                    End = table.Column<DateTime>(type: "datetime2", nullable: false),
                    AppointmentType = table.Column<int>(type: "int", nullable: false),
                    RepeatingPatternId = table.Column<int>(type: "int", nullable: true),
                    LocationId = table.Column<int>(type: "int", nullable: false),
                    TeamId = table.Column<int>(type: "int", nullable: false),
                    ParentAppointmentId = table.Column<int>(type: "int", nullable: true),
                    TrainingId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Appointments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Appointments_Appointments_ParentAppointmentId",
                        column: x => x.ParentAppointmentId,
                        principalTable: "Appointments",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Appointments_Places_LocationId",
                        column: x => x.LocationId,
                        principalTable: "Places",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Appointments_Teams_TeamId",
                        column: x => x.TeamId,
                        principalTable: "Teams",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Appointments_Trainings_TrainingId",
                        column: x => x.TrainingId,
                        principalTable: "Trainings",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "RepeatingPatterns",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RepeatingFrequency = table.Column<int>(type: "int", nullable: false),
                    Interval = table.Column<int>(type: "int", nullable: false),
                    StartDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    InitialAppointmentId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RepeatingPatterns", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RepeatingPatterns_Appointments_InitialAppointmentId",
                        column: x => x.InitialAppointmentId,
                        principalTable: "Appointments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_LocationId",
                table: "Appointments",
                column: "LocationId");

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_ParentAppointmentId",
                table: "Appointments",
                column: "ParentAppointmentId");

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_TeamId",
                table: "Appointments",
                column: "TeamId");

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_TrainingId",
                table: "Appointments",
                column: "TrainingId");

            migrationBuilder.CreateIndex(
                name: "IX_RepeatingPatterns_InitialAppointmentId",
                table: "RepeatingPatterns",
                column: "InitialAppointmentId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RepeatingPatterns");

            migrationBuilder.DropTable(
                name: "Appointments");
        }
    }
}
