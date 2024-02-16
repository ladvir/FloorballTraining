using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FloorballTraining.Plugins.EFCoreSqlServer.Migrations
{
    /// <inheritdoc />
    public partial class TrainingGoals : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Trainings_Tags_TrainingGoalId",
                table: "Trainings");

            migrationBuilder.RenameColumn(
                name: "TrainingGoalId",
                table: "Trainings",
                newName: "TrainingGoal1Id");

            migrationBuilder.RenameIndex(
                name: "IX_Trainings_TrainingGoalId",
                table: "Trainings",
                newName: "IX_Trainings_TrainingGoal1Id");

            migrationBuilder.AddColumn<int>(
                name: "TrainingGoal2Id",
                table: "Trainings",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TrainingGoal3Id",
                table: "Trainings",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Trainings_TrainingGoal2Id",
                table: "Trainings",
                column: "TrainingGoal2Id");

            migrationBuilder.CreateIndex(
                name: "IX_Trainings_TrainingGoal3Id",
                table: "Trainings",
                column: "TrainingGoal3Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Trainings_Tags_TrainingGoal1Id",
                table: "Trainings",
                column: "TrainingGoal1Id",
                principalTable: "Tags",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Trainings_Tags_TrainingGoal2Id",
                table: "Trainings",
                column: "TrainingGoal2Id",
                principalTable: "Tags",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Trainings_Tags_TrainingGoal3Id",
                table: "Trainings",
                column: "TrainingGoal3Id",
                principalTable: "Tags",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Trainings_Tags_TrainingGoal1Id",
                table: "Trainings");

            migrationBuilder.DropForeignKey(
                name: "FK_Trainings_Tags_TrainingGoal2Id",
                table: "Trainings");

            migrationBuilder.DropForeignKey(
                name: "FK_Trainings_Tags_TrainingGoal3Id",
                table: "Trainings");

            migrationBuilder.DropIndex(
                name: "IX_Trainings_TrainingGoal2Id",
                table: "Trainings");

            migrationBuilder.DropIndex(
                name: "IX_Trainings_TrainingGoal3Id",
                table: "Trainings");

            migrationBuilder.DropColumn(
                name: "TrainingGoal2Id",
                table: "Trainings");

            migrationBuilder.DropColumn(
                name: "TrainingGoal3Id",
                table: "Trainings");

            migrationBuilder.RenameColumn(
                name: "TrainingGoal1Id",
                table: "Trainings",
                newName: "TrainingGoalId");

            migrationBuilder.RenameIndex(
                name: "IX_Trainings_TrainingGoal1Id",
                table: "Trainings",
                newName: "IX_Trainings_TrainingGoalId");

            migrationBuilder.AddForeignKey(
                name: "FK_Trainings_Tags_TrainingGoalId",
                table: "Trainings",
                column: "TrainingGoalId",
                principalTable: "Tags",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
