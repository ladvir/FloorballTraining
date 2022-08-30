using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TrainingGenerator.Migrations
{
    public partial class initial : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Activity",
                columns: table => new
                {
                    ActivityId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Description = table.Column<string>(type: "TEXT", nullable: false),
                    PersonsMin = table.Column<int>(type: "INTEGER", nullable: true),
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
                    table.PrimaryKey("PK_Activity", x => x.ActivityId);
                });

            migrationBuilder.CreateTable(
                name: "Training",
                columns: table => new
                {
                    TrainingId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Duration = table.Column<int>(type: "INTEGER", nullable: false),
                    PersonsMin = table.Column<int>(type: "INTEGER", nullable: false),
                    PersonsMax = table.Column<int>(type: "INTEGER", nullable: false),
                    FlorbalPercent = table.Column<int>(type: "INTEGER", nullable: false),
                    PrefferedAktivityRatioMin = table.Column<double>(type: "REAL", nullable: false),
                    Note = table.Column<string>(type: "TEXT", nullable: false),
                    BeginTimeMax = table.Column<int>(type: "INTEGER", nullable: false),
                    WarmUpTimeMax = table.Column<int>(type: "INTEGER", nullable: false),
                    WarmUpExcerciseTimeMax = table.Column<int>(type: "INTEGER", nullable: false),
                    DrilTimeMax = table.Column<int>(type: "INTEGER", nullable: false),
                    StretchingTimeMax = table.Column<int>(type: "INTEGER", nullable: false),
                    EndTimeMax = table.Column<int>(type: "INTEGER", nullable: false),
                    BlockPauseTimeMax = table.Column<int>(type: "INTEGER", nullable: false),
                    ActivityPauseTimeMax = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Training", x => x.TrainingId);
                });

            migrationBuilder.CreateTable(
                name: "TrainingActivity",
                columns: table => new
                {
                    TrainingActivityId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    TrainingId = table.Column<int>(type: "INTEGER", nullable: false),
                    Order = table.Column<int>(type: "INTEGER", nullable: false),
                    DurationMin = table.Column<int>(type: "INTEGER", nullable: false),
                    DurationMax = table.Column<int>(type: "INTEGER", nullable: false),
                    ActivityId = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrainingActivity", x => x.TrainingActivityId);
                    table.ForeignKey(
                        name: "FK_TrainingActivity_Activity_ActivityId",
                        column: x => x.ActivityId,
                        principalTable: "Activity",
                        principalColumn: "ActivityId");
                    table.ForeignKey(
                        name: "FK_TrainingActivity_Training_TrainingId",
                        column: x => x.TrainingId,
                        principalTable: "Training",
                        principalColumn: "TrainingId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TrainingActivity_ActivityId",
                table: "TrainingActivity",
                column: "ActivityId");

            migrationBuilder.CreateIndex(
                name: "IX_TrainingActivity_TrainingId",
                table: "TrainingActivity",
                column: "TrainingId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TrainingActivity");

            migrationBuilder.DropTable(
                name: "Activity");

            migrationBuilder.DropTable(
                name: "Training");
        }
    }
}
