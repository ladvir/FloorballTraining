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
