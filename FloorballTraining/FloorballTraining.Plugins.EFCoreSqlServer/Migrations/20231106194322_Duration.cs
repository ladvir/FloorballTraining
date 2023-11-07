using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FloorballTraining.Plugins.EFCoreSqlServer.Migrations
{
    /// <inheritdoc />
    public partial class Duration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Duration",
                table: "TrainingGroupActivities");

            migrationBuilder.AddColumn<int>(
                name: "Duration",
                table: "TrainingParts",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.InsertData(
                table: "Equipments",
                columns: new[] { "EquipmentId", "Name" },
                values: new object[] { 9, "Florbalky" });

            migrationBuilder.InsertData(
                table: "Tags",
                columns: new[] { "TagId", "Color", "IsTrainingGoal", "Name", "ParentTagId" },
                values: new object[] { 39, "#d9980d", false, "Výzva", 5 });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Equipments",
                keyColumn: "EquipmentId",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "Tags",
                keyColumn: "TagId",
                keyValue: 39);

            migrationBuilder.DropColumn(
                name: "Duration",
                table: "TrainingParts");

            migrationBuilder.AddColumn<int>(
                name: "Duration",
                table: "TrainingGroupActivities",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }
    }
}
