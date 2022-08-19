using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TrainingGenerator.Migrations
{
    public partial class ActivityExtention : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Rating",
                table: "Activities");

            migrationBuilder.RenameColumn(
                name: "Duration",
                table: "Activities",
                newName: "DurationMin");

            migrationBuilder.AlterColumn<int>(
                name: "PersonsMin",
                table: "Activities",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "INTEGER",
                oldNullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DurationMax",
                table: "Activities",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsBallLeading",
                table: "Activities",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsConeNeeded",
                table: "Activities",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsDynamic",
                table: "Activities",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsFlexibility",
                table: "Activities",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsFlorbal",
                table: "Activities",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsFlorballBallsNeeded",
                table: "Activities",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsFlorballGateNeeded",
                table: "Activities",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsFootballBallNeeded",
                table: "Activities",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsForDefender",
                table: "Activities",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsForForward",
                table: "Activities",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsForGoalman",
                table: "Activities",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsGame",
                table: "Activities",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsGameSituation1x1",
                table: "Activities",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsGameSituation2x1",
                table: "Activities",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsGameSituation2x2",
                table: "Activities",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsGameSituation2x3",
                table: "Activities",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsGameSituation3x3",
                table: "Activities",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsGameSituation4x4",
                table: "Activities",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsGameSituation5x5",
                table: "Activities",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsHurdleNeeded",
                table: "Activities",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsJumpingLadderNeeded",
                table: "Activities",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsJumpingRopeNeeded",
                table: "Activities",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsPass",
                table: "Activities",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsPersistence",
                table: "Activities",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsRelay",
                table: "Activities",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsReleasing",
                table: "Activities",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsResulutionDressNeeded",
                table: "Activities",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsShooting",
                table: "Activities",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsSpeed",
                table: "Activities",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsStrength",
                table: "Activities",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsTeamWork",
                table: "Activities",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsTest",
                table: "Activities",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsThinking",
                table: "Activities",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsTrainingPartDril",
                table: "Activities",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsTrainingPartStretching",
                table: "Activities",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsTrainingPartWarmUp",
                table: "Activities",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsTrainingWarmUpExcercise",
                table: "Activities",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<long>(
                name: "RatingCount",
                table: "Activities",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<long>(
                name: "RatingSum",
                table: "Activities",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0L);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DurationMax",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "IsBallLeading",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "IsConeNeeded",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "IsDynamic",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "IsFlexibility",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "IsFlorbal",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "IsFlorballBallsNeeded",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "IsFlorballGateNeeded",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "IsFootballBallNeeded",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "IsForDefender",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "IsForForward",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "IsForGoalman",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "IsGame",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "IsGameSituation1x1",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "IsGameSituation2x1",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "IsGameSituation2x2",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "IsGameSituation2x3",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "IsGameSituation3x3",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "IsGameSituation4x4",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "IsGameSituation5x5",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "IsHurdleNeeded",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "IsJumpingLadderNeeded",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "IsJumpingRopeNeeded",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "IsPass",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "IsPersistence",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "IsRelay",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "IsReleasing",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "IsResulutionDressNeeded",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "IsShooting",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "IsSpeed",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "IsStrength",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "IsTeamWork",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "IsTest",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "IsThinking",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "IsTrainingPartDril",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "IsTrainingPartStretching",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "IsTrainingPartWarmUp",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "IsTrainingWarmUpExcercise",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "RatingCount",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "RatingSum",
                table: "Activities");

            migrationBuilder.RenameColumn(
                name: "DurationMin",
                table: "Activities",
                newName: "Duration");

            migrationBuilder.AlterColumn<int>(
                name: "PersonsMin",
                table: "Activities",
                type: "INTEGER",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "INTEGER");

            migrationBuilder.AddColumn<double>(
                name: "Rating",
                table: "Activities",
                type: "REAL",
                nullable: true);
        }
    }
}
