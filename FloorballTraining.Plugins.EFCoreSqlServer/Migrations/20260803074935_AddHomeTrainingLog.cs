using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FloorballTraining.Plugins.EFCoreSqlServer.Migrations
{
    /// <inheritdoc />
    public partial class AddHomeTrainingLog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "HomeTrainingLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MemberId = table.Column<int>(type: "int", nullable: false),
                    TrainingId = table.Column<int>(type: "int", nullable: true),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    DurationMin = table.Column<int>(type: "int", nullable: true),
                    Note = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    LoggedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ConfirmedByUserId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: true),
                    ConfirmedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    RejectedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    AppointmentId = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HomeTrainingLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HomeTrainingLogs_Appointments_AppointmentId",
                        column: x => x.AppointmentId,
                        principalTable: "Appointments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_HomeTrainingLogs_Members_MemberId",
                        column: x => x.MemberId,
                        principalTable: "Members",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_HomeTrainingLogs_Trainings_TrainingId",
                        column: x => x.TrainingId,
                        principalTable: "Trainings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_HomeTrainingLogs_AppointmentId",
                table: "HomeTrainingLogs",
                column: "AppointmentId");

            migrationBuilder.CreateIndex(
                name: "IX_HomeTrainingLogs_MemberId_LoggedAt",
                table: "HomeTrainingLogs",
                columns: new[] { "MemberId", "LoggedAt" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_HomeTrainingLogs_TrainingId",
                table: "HomeTrainingLogs",
                column: "TrainingId");

            // Personal "Doma" place — the required location FK for self-logged home-training events (#104).
            migrationBuilder.Sql(@"
IF NOT EXISTS (SELECT 1 FROM [Places] WHERE [Name] = N'Doma')
    INSERT INTO [Places] ([Name],[Width],[Length],[Environment]) VALUES (N'Doma', 1, 1, 0);
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "HomeTrainingLogs");

            migrationBuilder.Sql(@"
DELETE FROM [Places] WHERE [Name] = N'Doma'
    AND NOT EXISTS (SELECT 1 FROM [Appointments] WHERE [LocationId] = [Places].[Id]);
");
        }
    }
}
