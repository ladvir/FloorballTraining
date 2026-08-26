using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FloorballTraining.Plugins.EFCoreSqlServer.Migrations
{
    /// <inheritdoc />
    public partial class AddTrainingGoalSkills : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "TrainingGoalSkill1Id",
                table: "Trainings",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TrainingGoalSkill2Id",
                table: "Trainings",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TrainingGoalSkill3Id",
                table: "Trainings",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Trainings_TrainingGoalSkill1Id",
                table: "Trainings",
                column: "TrainingGoalSkill1Id");

            migrationBuilder.CreateIndex(
                name: "IX_Trainings_TrainingGoalSkill2Id",
                table: "Trainings",
                column: "TrainingGoalSkill2Id");

            migrationBuilder.CreateIndex(
                name: "IX_Trainings_TrainingGoalSkill3Id",
                table: "Trainings",
                column: "TrainingGoalSkill3Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Trainings_Skills_TrainingGoalSkill1Id",
                table: "Trainings",
                column: "TrainingGoalSkill1Id",
                principalTable: "Skills",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Trainings_Skills_TrainingGoalSkill2Id",
                table: "Trainings",
                column: "TrainingGoalSkill2Id",
                principalTable: "Skills",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Trainings_Skills_TrainingGoalSkill3Id",
                table: "Trainings",
                column: "TrainingGoalSkill3Id",
                principalTable: "Skills",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Trainings_Skills_TrainingGoalSkill1Id",
                table: "Trainings");

            migrationBuilder.DropForeignKey(
                name: "FK_Trainings_Skills_TrainingGoalSkill2Id",
                table: "Trainings");

            migrationBuilder.DropForeignKey(
                name: "FK_Trainings_Skills_TrainingGoalSkill3Id",
                table: "Trainings");

            migrationBuilder.DropIndex(
                name: "IX_Trainings_TrainingGoalSkill1Id",
                table: "Trainings");

            migrationBuilder.DropIndex(
                name: "IX_Trainings_TrainingGoalSkill2Id",
                table: "Trainings");

            migrationBuilder.DropIndex(
                name: "IX_Trainings_TrainingGoalSkill3Id",
                table: "Trainings");

            migrationBuilder.DropColumn(
                name: "TrainingGoalSkill1Id",
                table: "Trainings");

            migrationBuilder.DropColumn(
                name: "TrainingGoalSkill2Id",
                table: "Trainings");

            migrationBuilder.DropColumn(
                name: "TrainingGoalSkill3Id",
                table: "Trainings");
        }
    }
}
