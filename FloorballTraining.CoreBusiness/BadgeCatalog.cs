using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.CoreBusiness;

/// <summary>The aggregate a badge is measured against.</summary>
public enum BadgeMetric
{
    /// <summary>Lifetime count of present trainings.</summary>
    TrainingCount,
    /// <summary>Lifetime net goals.</summary>
    GoalCount,
    /// <summary>Lifetime net assists.</summary>
    AssistCount,
    /// <summary>Best single-match goal tally (→ hattrick).</summary>
    MaxGoalsInMatch,
    /// <summary>Distinct seasons the member attended.</summary>
    SeasonsPlayed,
    /// <summary>Per-season attendance percentage (Iron Man).</summary>
    SeasonAttendancePct
}

/// <summary>
/// Static badge definitions (#97) — the epic's "BadgeDefinition", kept in code like <see cref="XpRules"/>
/// rather than a DB table: thresholds are fixed placeholders and names/descriptions are i18n keys on the
/// client (badge.{code}.name / .desc), so nothing about a definition needs to live in SQL.
/// ponytail: flat const catalog; move to a DbSet only if clubs need per-club badge sets/thresholds.
/// Deferred families (untested, need cross-member or extra joins): attendance streak, "most improved"
/// (relative, per-period), "all-rounder" (every skill category ≤ 2). Add when a test/spec pins them down.
/// </summary>
public static class BadgeCatalog
{
    /// <summary>Minimum recorded season appointments before an attendance % can earn Iron Man (guards 1/1 = 100%).</summary>
    public const int IronManMinAppointments = 5;
    /// <summary>Attendance % threshold for Iron Man.</summary>
    public const int IronManPercent = 80;

    public record Def(BadgeCode Code, string Icon, BadgeMetric Metric, int Threshold);

    public static readonly IReadOnlyList<Def> All =
    [
        new(BadgeCode.Attendance10,  "🏃", BadgeMetric.TrainingCount, 10),
        new(BadgeCode.Attendance25,  "🏃", BadgeMetric.TrainingCount, 25),
        new(BadgeCode.Attendance50,  "🏃", BadgeMetric.TrainingCount, 50),
        new(BadgeCode.Attendance100, "🏃", BadgeMetric.TrainingCount, 100),
        new(BadgeCode.FirstGoal,     "🥅", BadgeMetric.GoalCount, 1),
        new(BadgeCode.Goals10,       "🥅", BadgeMetric.GoalCount, 10),
        new(BadgeCode.Goals50,       "🥅", BadgeMetric.GoalCount, 50),
        new(BadgeCode.Hattrick,      "🎩", BadgeMetric.MaxGoalsInMatch, 3),
        new(BadgeCode.Assists10,     "🅰️", BadgeMetric.AssistCount, 10),
        new(BadgeCode.Assists25,     "🅰️", BadgeMetric.AssistCount, 25),
        new(BadgeCode.IronMan,       "💪", BadgeMetric.SeasonAttendancePct, IronManPercent),
        new(BadgeCode.Loyalty3,      "💛", BadgeMetric.SeasonsPlayed, 3)
    ];
}
