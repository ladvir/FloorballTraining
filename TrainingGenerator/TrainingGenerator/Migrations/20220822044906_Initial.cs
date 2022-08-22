using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TrainingGenerator.Migrations
{
    public partial class Initial : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            try
            {
                migrationBuilder.DropTable(
                    name: "Activities");

                migrationBuilder.DropTable(
                    name: "TrainingActivities");

                migrationBuilder.DropTable(
                    name: "TrainingActivity");

                migrationBuilder.DropTable(
                    name: "Trainings");
            }
            catch { }

            migrationBuilder.CreateTable(
                name: "Activities",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Description = table.Column<string>(type: "TEXT", nullable: false),
                    PersonsMin = table.Column<int>(type: "INTEGER", nullable: false),
                    PersonsMax = table.Column<int>(type: "INTEGER", nullable: true),
                    DurationMin = table.Column<int>(type: "INTEGER", nullable: true),
                    DurationMax = table.Column<int>(type: "INTEGER", nullable: true),
                    RatingSum = table.Column<long>(type: "INTEGER", nullable: false),
                    RatingCount = table.Column<long>(type: "INTEGER", nullable: false),
                    IsGameSituation1x1 = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsGameSituation2x2 = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsGameSituation3x3 = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsGameSituation4x4 = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsGameSituation5x5 = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsGameSituation2x3 = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsGameSituation2x1 = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsForGoalman = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsForForward = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsForDefender = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsTrainingPartWarmUp = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsTrainingWarmUpExcercise = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsTrainingPartDril = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsTrainingPartStretching = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsGame = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsFlorbal = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsTest = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsRelay = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsShooting = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsPass = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsBallLeading = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsFlexibility = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsStrength = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsDynamic = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsReleasing = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsSpeed = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsPersistence = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsThinking = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsTeamWork = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsFlorballBallsNeeded = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsFlorballGateNeeded = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsResulutionDressNeeded = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsConeNeeded = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsHurdleNeeded = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsJumpingLadderNeeded = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsJumpingRopeNeeded = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsFootballBallNeeded = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Activities", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TrainingActivities",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    TreninkId = table.Column<int>(type: "INTEGER", nullable: false),
                    ActivityId = table.Column<int>(type: "INTEGER", nullable: false),
                    Order = table.Column<int>(type: "INTEGER", nullable: false),
                    DurationMin = table.Column<int>(type: "INTEGER", nullable: false),
                    DurationMax = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrainingActivities", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Trainings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Duration = table.Column<int>(type: "INTEGER", nullable: false),
                    PersonsMin = table.Column<int>(type: "INTEGER", nullable: false),
                    PersonsMax = table.Column<int>(type: "INTEGER", nullable: false),
                    FlorbalPercent = table.Column<double>(type: "REAL", nullable: false),
                    PrefferedAktivityRatioMin = table.Column<double>(type: "REAL", nullable: false),
                    Note = table.Column<string>(type: "TEXT", nullable: false),
                    RatingSum = table.Column<long>(type: "INTEGER", nullable: false),
                    RatingCount = table.Column<long>(type: "INTEGER", nullable: false),
                    BeginTimeMin = table.Column<int>(type: "INTEGER", nullable: false),
                    BeginTimeMax = table.Column<int>(type: "INTEGER", nullable: false),
                    WarmUpTimeMin = table.Column<int>(type: "INTEGER", nullable: false),
                    WarmUpTimeMax = table.Column<int>(type: "INTEGER", nullable: false),
                    WarmUpExcerciseTimeMin = table.Column<int>(type: "INTEGER", nullable: false),
                    WarmUpExcerciseTimeMax = table.Column<int>(type: "INTEGER", nullable: false),
                    DrilTimeMin = table.Column<int>(type: "INTEGER", nullable: false),
                    DrilTimeMax = table.Column<int>(type: "INTEGER", nullable: false),
                    StretchingTimeMin = table.Column<int>(type: "INTEGER", nullable: false),
                    StretchingTimeMax = table.Column<int>(type: "INTEGER", nullable: false),
                    EndTimeMin = table.Column<int>(type: "INTEGER", nullable: false),
                    EndTimeMax = table.Column<int>(type: "INTEGER", nullable: false),
                    BlockPauseTimeMin = table.Column<int>(type: "INTEGER", nullable: false),
                    BlockPauseTimeMax = table.Column<int>(type: "INTEGER", nullable: false),
                    ActivityPauseTimeMin = table.Column<int>(type: "INTEGER", nullable: false),
                    ActivityPauseTimeMax = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Trainings", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TrainingActivity",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    TreninkId = table.Column<int>(type: "INTEGER", nullable: false),
                    ActivityId = table.Column<int>(type: "INTEGER", nullable: false),
                    Order = table.Column<int>(type: "INTEGER", nullable: false),
                    DurationMin = table.Column<int>(type: "INTEGER", nullable: false),
                    DurationMax = table.Column<int>(type: "INTEGER", nullable: false),
                    TrainingDTOId = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrainingActivity", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TrainingActivity_Trainings_TrainingDTOId",
                        column: x => x.TrainingDTOId,
                        principalTable: "Trainings",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_TrainingActivity_TrainingDTOId",
                table: "TrainingActivity",
                column: "TrainingDTOId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Activities");

            migrationBuilder.DropTable(
                name: "TrainingActivities");

            migrationBuilder.DropTable(
                name: "TrainingActivity");

            migrationBuilder.DropTable(
                name: "Trainings");
        }
    }
}