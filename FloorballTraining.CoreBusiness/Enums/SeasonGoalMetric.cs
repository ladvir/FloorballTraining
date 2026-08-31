using System.ComponentModel;

namespace FloorballTraining.CoreBusiness.Enums;

/// <summary>
/// What a <see cref="SeasonGoal"/> measures. Progress is computed on read from data that
/// already exists (StatTracker match entries, TestResult, Appointment + attendance) — nothing
/// is stored per goal except the manual ones and the verdict override.
/// </summary>
public enum SeasonGoalMetric
{
    // ── Match record — StatTrackers with EventCategory 0 in the season ────────
    [Description("Počet výher")] Wins = 0,
    [Description("Počet proher")] Losses = 1,
    [Description("Počet remíz")] Draws = 2,
    [Description("Body (3/1/0)")] Points = 3,
    [Description("Úspěšnost (%)")] WinRatePercent = 4,
    [Description("Vstřelené góly")] GoalsFor = 5,
    [Description("Obdržené góly")] GoalsAgainst = 6,
    [Description("Skóre (rozdíl)")] GoalDifference = 7,

    // ── Tests — need TestDefinitionId ────────────────────────────────────────
    [Description("Týmový průměr testu")] TestTeamAverage = 20,
    [Description("Zlepšení týmového průměru testu")] TestAverageImprovement = 21,
    [Description("Podíl zlepšených hráčů v testu (%)")] TestImprovedSharePercent = 22,

    // ── Training process — Appointments + attendance in the season ────────────
    [Description("Průměrná docházka (%)")] AttendanceRatePercent = 40,
    [Description("Počet odtrénovaných tréninků")] TrainingsCompleted = 41,

    // ── Manual — coach maintains the current value ───────────────────────────
    [Description("Ruční cíl (splněno / nesplněno)")] ManualDone = 60,
    [Description("Ruční cíl s progresem")] ManualProgress = 61,

    // ── Not a goal: coach override of the season verdict for this team ───────
    [Description("Ruční verdikt sezóny")] OutcomeOverride = 99,
}

/// <summary>Whether the current value must reach or stay under the target.</summary>
public enum SeasonGoalDirection
{
    [Description("Alespoň")] AtLeast = 0,
    [Description("Nejvýše")] AtMost = 1,
}
