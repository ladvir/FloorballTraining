using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FloorballTraining.Plugins.EFCoreSqlServer.Migrations
{
    /// <inheritdoc />
    public partial class AddFanCheckIn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FanCheckIns",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AppointmentId = table.Column<int>(type: "int", nullable: false),
                    GuardianAppUserId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    MemberId = table.Column<int>(type: "int", nullable: false),
                    CheckedInAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FanCheckIns", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FanCheckIns_Appointments_AppointmentId",
                        column: x => x.AppointmentId,
                        principalTable: "Appointments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_FanCheckIns_Members_MemberId",
                        column: x => x.MemberId,
                        principalTable: "Members",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_FanCheckIns_AppointmentId_GuardianAppUserId_MemberId",
                table: "FanCheckIns",
                columns: new[] { "AppointmentId", "GuardianAppUserId", "MemberId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_FanCheckIns_MemberId",
                table: "FanCheckIns",
                column: "MemberId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FanCheckIns");
        }
    }
}
