using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FloorballTraining.Plugins.EFCoreSqlServer.Migrations
{
    /// <inheritdoc />
    public partial class AddTeamMaxDurations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                IF COL_LENGTH('Teams', 'MaxTrainingDuration') IS NULL
                BEGIN
                    ALTER TABLE [Teams] ADD [MaxTrainingDuration] int NULL;
                END

                IF COL_LENGTH('Teams', 'MaxTrainingPartDuration') IS NULL
                BEGIN
                    ALTER TABLE [Teams] ADD [MaxTrainingPartDuration] int NULL;
                END
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MaxTrainingDuration",
                table: "Teams");

            migrationBuilder.DropColumn(
                name: "MaxTrainingPartDuration",
                table: "Teams");
        }
    }
}
