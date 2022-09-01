using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TrainingGenerator.Migrations
{
    public partial class ta2 : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PrefferedAktivityRatioMin",
                table: "Training");

            migrationBuilder.AddColumn<bool>(
                name: "IsBallLeading",
                table: "Training",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsConeNeeded",
                table: "Training",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsDynamic",
                table: "Training",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsFlexibility",
                table: "Training",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsFlorbal",
                table: "Training",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsFlorballBallsNeeded",
                table: "Training",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsFlorballGateNeeded",
                table: "Training",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsFootballBallNeeded",
                table: "Training",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsForDefender",
                table: "Training",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsForForward",
                table: "Training",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsForGoalman",
                table: "Training",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsGame",
                table: "Training",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsGameSituation1x1",
                table: "Training",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsGameSituation2x1",
                table: "Training",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsGameSituation2x2",
                table: "Training",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsGameSituation2x3",
                table: "Training",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsGameSituation3x3",
                table: "Training",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsGameSituation4x4",
                table: "Training",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsGameSituation5x5",
                table: "Training",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsHurdleNeeded",
                table: "Training",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsJumpingLadderNeeded",
                table: "Training",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsJumpingRopeNeeded",
                table: "Training",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsPass",
                table: "Training",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsPersistence",
                table: "Training",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsRelay",
                table: "Training",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsReleasing",
                table: "Training",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsResulutionDressNeeded",
                table: "Training",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsShooting",
                table: "Training",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsSpeed",
                table: "Training",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsStrength",
                table: "Training",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsTeamWork",
                table: "Training",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsTest",
                table: "Training",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsThinking",
                table: "Training",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsTrainingPartDril",
                table: "Training",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsTrainingPartStretching",
                table: "Training",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsTrainingPartWarmUp",
                table: "Training",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsTrainingWarmUpExcercise",
                table: "Training",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsBallLeading",
                table: "Training");

            migrationBuilder.DropColumn(
                name: "IsConeNeeded",
                table: "Training");

            migrationBuilder.DropColumn(
                name: "IsDynamic",
                table: "Training");

            migrationBuilder.DropColumn(
                name: "IsFlexibility",
                table: "Training");

            migrationBuilder.DropColumn(
                name: "IsFlorbal",
                table: "Training");

            migrationBuilder.DropColumn(
                name: "IsFlorballBallsNeeded",
                table: "Training");

            migrationBuilder.DropColumn(
                name: "IsFlorballGateNeeded",
                table: "Training");

            migrationBuilder.DropColumn(
                name: "IsFootballBallNeeded",
                table: "Training");

            migrationBuilder.DropColumn(
                name: "IsForDefender",
                table: "Training");

            migrationBuilder.DropColumn(
                name: "IsForForward",
                table: "Training");

            migrationBuilder.DropColumn(
                name: "IsForGoalman",
                table: "Training");

            migrationBuilder.DropColumn(
                name: "IsGame",
                table: "Training");

            migrationBuilder.DropColumn(
                name: "IsGameSituation1x1",
                table: "Training");

            migrationBuilder.DropColumn(
                name: "IsGameSituation2x1",
                table: "Training");

            migrationBuilder.DropColumn(
                name: "IsGameSituation2x2",
                table: "Training");

            migrationBuilder.DropColumn(
                name: "IsGameSituation2x3",
                table: "Training");

            migrationBuilder.DropColumn(
                name: "IsGameSituation3x3",
                table: "Training");

            migrationBuilder.DropColumn(
                name: "IsGameSituation4x4",
                table: "Training");

            migrationBuilder.DropColumn(
                name: "IsGameSituation5x5",
                table: "Training");

            migrationBuilder.DropColumn(
                name: "IsHurdleNeeded",
                table: "Training");

            migrationBuilder.DropColumn(
                name: "IsJumpingLadderNeeded",
                table: "Training");

            migrationBuilder.DropColumn(
                name: "IsJumpingRopeNeeded",
                table: "Training");

            migrationBuilder.DropColumn(
                name: "IsPass",
                table: "Training");

            migrationBuilder.DropColumn(
                name: "IsPersistence",
                table: "Training");

            migrationBuilder.DropColumn(
                name: "IsRelay",
                table: "Training");

            migrationBuilder.DropColumn(
                name: "IsReleasing",
                table: "Training");

            migrationBuilder.DropColumn(
                name: "IsResulutionDressNeeded",
                table: "Training");

            migrationBuilder.DropColumn(
                name: "IsShooting",
                table: "Training");

            migrationBuilder.DropColumn(
                name: "IsSpeed",
                table: "Training");

            migrationBuilder.DropColumn(
                name: "IsStrength",
                table: "Training");

            migrationBuilder.DropColumn(
                name: "IsTeamWork",
                table: "Training");

            migrationBuilder.DropColumn(
                name: "IsTest",
                table: "Training");

            migrationBuilder.DropColumn(
                name: "IsThinking",
                table: "Training");

            migrationBuilder.DropColumn(
                name: "IsTrainingPartDril",
                table: "Training");

            migrationBuilder.DropColumn(
                name: "IsTrainingPartStretching",
                table: "Training");

            migrationBuilder.DropColumn(
                name: "IsTrainingPartWarmUp",
                table: "Training");

            migrationBuilder.DropColumn(
                name: "IsTrainingWarmUpExcercise",
                table: "Training");

            migrationBuilder.AddColumn<double>(
                name: "PrefferedAktivityRatioMin",
                table: "Training",
                type: "REAL",
                nullable: false,
                defaultValue: 0.0);
        }
    }
}
