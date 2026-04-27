using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace FloorballTraining.Plugins.EFCoreSqlServer.Migrations
{
    /// <inheritdoc />
    public partial class AddPowerPlayFormation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "FormationTemplates",
                columns: new[] { "Id", "ClubId", "FormationSize", "IncludesGoalie", "IsBuiltIn", "Name" },
                values: new object[] { 6, null, 6, false, true, "6+0 power play" });

            migrationBuilder.InsertData(
                table: "FormationTemplateSlots",
                columns: new[] { "Id", "FormationTemplateId", "Position", "SortOrder", "X", "Y" },
                values: new object[,]
                {
                    { 51, 6, 1, 0, 70.0, 20.0 },
                    { 52, 6, 2, 1, 30.0, 20.0 },
                    { 53, 6, 3, 2, 60.0, 50.0 },
                    { 54, 6, 3, 3, 40.0, 50.0 },
                    { 55, 6, 4, 4, 22.0, 82.0 },
                    { 56, 6, 5, 5, 78.0, 82.0 }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "FormationTemplateSlots",
                keyColumn: "Id",
                keyValue: 51);

            migrationBuilder.DeleteData(
                table: "FormationTemplateSlots",
                keyColumn: "Id",
                keyValue: 52);

            migrationBuilder.DeleteData(
                table: "FormationTemplateSlots",
                keyColumn: "Id",
                keyValue: 53);

            migrationBuilder.DeleteData(
                table: "FormationTemplateSlots",
                keyColumn: "Id",
                keyValue: 54);

            migrationBuilder.DeleteData(
                table: "FormationTemplateSlots",
                keyColumn: "Id",
                keyValue: 55);

            migrationBuilder.DeleteData(
                table: "FormationTemplateSlots",
                keyColumn: "Id",
                keyValue: 56);

            migrationBuilder.DeleteData(
                table: "FormationTemplates",
                keyColumn: "Id",
                keyValue: 6);
        }
    }
}
