using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FloorballTraining.Plugins.EFCoreSqlServer.Migrations
{
    /// <inheritdoc />
    public partial class Appointments3 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RepeatingPatterns_Appointments_InitialAppointmentId",
                table: "RepeatingPatterns");

            migrationBuilder.AddForeignKey(
                name: "FK_RepeatingPatterns_Appointments_InitialAppointmentId",
                table: "RepeatingPatterns",
                column: "InitialAppointmentId",
                principalTable: "Appointments",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RepeatingPatterns_Appointments_InitialAppointmentId",
                table: "RepeatingPatterns");

            migrationBuilder.AddForeignKey(
                name: "FK_RepeatingPatterns_Appointments_InitialAppointmentId",
                table: "RepeatingPatterns",
                column: "InitialAppointmentId",
                principalTable: "Appointments",
                principalColumn: "Id");
        }
    }
}
