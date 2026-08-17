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
    SeasonAttendancePct,

    // Career expansion (10-season plan) — added 2026-08-14.
    /// <summary>Lifetime count of present matches.</summary>
    MatchCount,
    /// <summary>Lifetime goals + assists combined ("points").</summary>
    GoalsPlusAssists,
    /// <summary>Lifetime net plus/minus (plus entries minus minus entries).</summary>
    NetPlusMinus,
    /// <summary>Lifetime count of confirmed home-training logs.</summary>
    HomeTrainingCount,
    /// <summary>Lifetime count of skill-grade improvements.</summary>
    SkillImprovementCount,
    /// <summary>Lifetime count of skill targets reached.</summary>
    SkillTargetCount,
    /// <summary>Lifetime count of test personal records.</summary>
    TestRecordCount,
    /// <summary>Lifetime count of "player of training" coach awards.</summary>
    PlayerOfTrainingCount,
    /// <summary>Lifetime count of fair-play coach awards.</summary>
    FairPlayCount,
    /// <summary>Lifetime count of "family cheered" events.</summary>
    FamilyCheeredCount,
    /// <summary>Lifetime count of completed challenges.</summary>
    ChallengeCount,
    /// <summary>Lifetime XP total (unrounded sum of every XpEvent — see BadgeService for the
    /// simplification this makes vs. XpService's capped/displayed total).</summary>
    CareerXp
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

    /// <summary>Icon is a path under wwwroot, served statically (e.g. "badges/attendance10.png") —
    /// same convention as <see cref="Video.FilePath"/>. Generated via Higgsfield MCP (gpt_image_2).</summary>
    public static readonly IReadOnlyList<Def> All =
    [
        new(BadgeCode.Attendance10,  "badges/attendance10.png",  BadgeMetric.TrainingCount, 10),
        new(BadgeCode.Attendance25,  "badges/attendance25.png",  BadgeMetric.TrainingCount, 25),
        new(BadgeCode.Attendance50,  "badges/attendance50.png",  BadgeMetric.TrainingCount, 50),
        new(BadgeCode.Attendance100, "badges/attendance100.png", BadgeMetric.TrainingCount, 100),
        new(BadgeCode.FirstGoal,     "badges/firstgoal.png",     BadgeMetric.GoalCount, 1),
        new(BadgeCode.Goals10,       "badges/goals10.png",       BadgeMetric.GoalCount, 10),
        new(BadgeCode.Goals50,       "badges/goals50.png",       BadgeMetric.GoalCount, 50),
        new(BadgeCode.Hattrick,      "badges/hattrick.png",      BadgeMetric.MaxGoalsInMatch, 3),
        new(BadgeCode.Assists10,     "badges/assists10.png",     BadgeMetric.AssistCount, 10),
        new(BadgeCode.Assists25,     "badges/assists25.png",     BadgeMetric.AssistCount, 25),
        new(BadgeCode.IronMan,       "badges/ironman.png",       BadgeMetric.SeasonAttendancePct, IronManPercent),
        new(BadgeCode.Loyalty3,      "badges/loyalty3.png",      BadgeMetric.SeasonsPlayed, 3),

        // Career expansion (10-season plan) — added 2026-08-14.
        new(BadgeCode.Attendance150,       "badges/attendance150.png",       BadgeMetric.TrainingCount, 150),
        new(BadgeCode.Attendance250,       "badges/attendance250.png",       BadgeMetric.TrainingCount, 250),
        new(BadgeCode.Attendance400,       "badges/attendance400.png",       BadgeMetric.TrainingCount, 400),
        new(BadgeCode.Matches25,           "badges/matches25.png",           BadgeMetric.MatchCount, 25),
        new(BadgeCode.Matches100,          "badges/matches100.png",          BadgeMetric.MatchCount, 100),
        new(BadgeCode.Matches250,          "badges/matches250.png",          BadgeMetric.MatchCount, 250),
        new(BadgeCode.Goals100,            "badges/goals100.png",            BadgeMetric.GoalCount, 100),
        new(BadgeCode.Goals250,            "badges/goals250.png",            BadgeMetric.GoalCount, 250),
        new(BadgeCode.Goals500,            "badges/goals500.png",            BadgeMetric.GoalCount, 500),
        new(BadgeCode.FourGoalsInMatch,    "badges/fourgoals.png",           BadgeMetric.MaxGoalsInMatch, 4),
        new(BadgeCode.FiveGoalsInMatch,    "badges/fivegoals.png",           BadgeMetric.MaxGoalsInMatch, 5),
        new(BadgeCode.Assists50,           "badges/assists50.png",           BadgeMetric.AssistCount, 50),
        new(BadgeCode.Assists100,          "badges/assists100.png",          BadgeMetric.AssistCount, 100),
        new(BadgeCode.Points50,            "badges/points50.png",            BadgeMetric.GoalsPlusAssists, 50),
        new(BadgeCode.Points150,           "badges/points150.png",           BadgeMetric.GoalsPlusAssists, 150),
        new(BadgeCode.Points300,           "badges/points300.png",           BadgeMetric.GoalsPlusAssists, 300),
        new(BadgeCode.Points600,           "badges/points600.png",           BadgeMetric.GoalsPlusAssists, 600),
        new(BadgeCode.PlusMinus20,         "badges/plusminus20.png",         BadgeMetric.NetPlusMinus, 20),
        new(BadgeCode.PlusMinus50,         "badges/plusminus50.png",         BadgeMetric.NetPlusMinus, 50),
        new(BadgeCode.PlusMinus100,        "badges/plusminus100.png",        BadgeMetric.NetPlusMinus, 100),
        new(BadgeCode.SeasonAttendance90,  "badges/seasonattendance90.png",  BadgeMetric.SeasonAttendancePct, 90),
        new(BadgeCode.SeasonAttendance100, "badges/seasonattendance100.png", BadgeMetric.SeasonAttendancePct, 100),
        new(BadgeCode.Loyalty5,            "badges/loyalty5.png",            BadgeMetric.SeasonsPlayed, 5),
        new(BadgeCode.Loyalty8,            "badges/loyalty8.png",            BadgeMetric.SeasonsPlayed, 8),
        new(BadgeCode.Loyalty10,           "badges/loyalty10.png",           BadgeMetric.SeasonsPlayed, 10),
        new(BadgeCode.HomeTraining10,      "badges/hometraining10.png",      BadgeMetric.HomeTrainingCount, 10),
        new(BadgeCode.HomeTraining50,      "badges/hometraining50.png",      BadgeMetric.HomeTrainingCount, 50),
        new(BadgeCode.HomeTraining150,     "badges/hometraining150.png",     BadgeMetric.HomeTrainingCount, 150),
        new(BadgeCode.SkillImprovement1,   "badges/skillimprovement1.png",   BadgeMetric.SkillImprovementCount, 1),
        new(BadgeCode.SkillImprovement10,  "badges/skillimprovement10.png",  BadgeMetric.SkillImprovementCount, 10),
        new(BadgeCode.SkillImprovement25,  "badges/skillimprovement25.png",  BadgeMetric.SkillImprovementCount, 25),
        new(BadgeCode.SkillTarget5,        "badges/skilltarget5.png",        BadgeMetric.SkillTargetCount, 5),
        new(BadgeCode.SkillTarget15,       "badges/skilltarget15.png",       BadgeMetric.SkillTargetCount, 15),
        new(BadgeCode.TestRecord1,         "badges/testrecord1.png",         BadgeMetric.TestRecordCount, 1),
        new(BadgeCode.TestRecord10,        "badges/testrecord10.png",        BadgeMetric.TestRecordCount, 10),
        new(BadgeCode.PlayerOfTraining5,   "badges/playeroftraining5.png",   BadgeMetric.PlayerOfTrainingCount, 5),
        new(BadgeCode.PlayerOfTraining20,  "badges/playeroftraining20.png",  BadgeMetric.PlayerOfTrainingCount, 20),
        new(BadgeCode.FairPlay5,           "badges/fairplay5.png",           BadgeMetric.FairPlayCount, 5),
        new(BadgeCode.FairPlay20,          "badges/fairplay20.png",          BadgeMetric.FairPlayCount, 20),
        new(BadgeCode.FamilyCheered10,     "badges/familycheered10.png",     BadgeMetric.FamilyCheeredCount, 10),
        new(BadgeCode.FamilyCheered50,     "badges/familycheered50.png",     BadgeMetric.FamilyCheeredCount, 50),
        new(BadgeCode.Challenges10,        "badges/challenges10.png",        BadgeMetric.ChallengeCount, 10),
        new(BadgeCode.Challenges50,        "badges/challenges50.png",        BadgeMetric.ChallengeCount, 50),
        new(BadgeCode.CareerXp5000,        "badges/careerxp5000.png",        BadgeMetric.CareerXp, 5000),
        new(BadgeCode.CareerXp15000,       "badges/careerxp15000.png",       BadgeMetric.CareerXp, 15000),
        new(BadgeCode.CareerXp30000,       "badges/careerxp30000.png",       BadgeMetric.CareerXp, 30000)
    ];
}
