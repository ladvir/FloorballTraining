using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.CoreBusiness;

/// <summary>
/// XP point values per event type. Placeholder constants — tuning/config is a later stage (#93 epic),
/// deliberately not made configurable now.
/// ponytail: flat const table, move to a rules DbSet only if clubs need per-club values.
/// </summary>
public static class XpRules
{
    public const int TrainingAttendance = 10;
    public const int MatchAttendance = 20;
    public const int Goal = 15;
    public const int Assist = 10;
    /// <summary>Magnitude per plus/minus entry; sign comes from the entry direction at derivation.</summary>
    public const int PlusMinus = 2;
    public const int SkillGradeImprovement = 25;
    public const int SkillTargetReached = 50;
    public const int TestPersonalRecord = 20;
    // Layer B — coach 1-click bonuses (#100).
    public const int PlayerOfTraining = 10;
    public const int FairPlay = 10;
    public const int FamilyCheered = 5;
    /// <summary>Family Fan XP per guardian check-in (#103) — a live family aggregate, not a child's career XP.</summary>
    public const int FanCheckInFamilyXp = 10;
    // Layer C — capped self-report (#104).
    /// <summary>Points per confirmed home-training log — below <see cref="TrainingAttendance"/> because it is self-reported.</summary>
    public const int HomeTraining = 8;
    /// <summary>Counted home XP is capped at this percent of the player's non-home ("earned") XP; nonHome=0 → cap=0.</summary>
    public const int HomeXpCapPercent = 30;
    /// <summary>Multiple home logs are allowed per day, but their counted XP for that day cannot exceed
    /// one normal team training (#104 update). Applied per day before the <see cref="HomeXpCapPercent"/> cap.</summary>
    public const int HomeDailyXpCap = TrainingAttendance;

    public static int PointsFor(XpEventType type) => type switch
    {
        XpEventType.TrainingAttendance => TrainingAttendance,
        XpEventType.MatchAttendance => MatchAttendance,
        XpEventType.Goal => Goal,
        XpEventType.Assist => Assist,
        XpEventType.PlusMinus => PlusMinus,
        XpEventType.SkillGradeImprovement => SkillGradeImprovement,
        XpEventType.SkillTargetReached => SkillTargetReached,
        XpEventType.TestPersonalRecord => TestPersonalRecord,
        XpEventType.PlayerOfTraining => PlayerOfTraining,
        XpEventType.FairPlay => FairPlay,
        XpEventType.FamilyCheered => FamilyCheered,
        XpEventType.HomeTraining => HomeTraining,
        _ => 0
    };

    /// <summary>Maps a coach bonus kind to its ledger event type (#100).</summary>
    public static XpEventType EventTypeFor(AwardType award) => award switch
    {
        AwardType.PlayerOfTraining => XpEventType.PlayerOfTraining,
        AwardType.FairPlay => XpEventType.FairPlay,
        AwardType.FamilyCheered => XpEventType.FamilyCheered,
        _ => throw new ArgumentOutOfRangeException(nameof(award))
    };
}
