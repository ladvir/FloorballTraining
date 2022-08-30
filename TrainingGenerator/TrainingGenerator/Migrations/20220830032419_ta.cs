using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TrainingGenerator.Migrations
{
    public partial class ta : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TrainingActivity_Activity_ActivityId",
                table: "TrainingActivity");

            migrationBuilder.AlterColumn<int>(
                name: "ActivityId",
                table: "TrainingActivity",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "INTEGER",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_TrainingActivity_Activity_ActivityId",
                table: "TrainingActivity",
                column: "ActivityId",
                principalTable: "Activity",
                principalColumn: "ActivityId",
                onDelete: ReferentialAction.Cascade);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TrainingActivity_Activity_ActivityId",
                table: "TrainingActivity");

            migrationBuilder.AlterColumn<int>(
                name: "ActivityId",
                table: "TrainingActivity",
                type: "INTEGER",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "INTEGER");

            migrationBuilder.AddForeignKey(
                name: "FK_TrainingActivity_Activity_ActivityId",
                table: "TrainingActivity",
                column: "ActivityId",
                principalTable: "Activity",
                principalColumn: "ActivityId");
        }
    }
}
