namespace FloorballTraining.CoreBusiness;

/// <summary>The derived metric a challenge measures progress against. Every value is SELF-ACTIONABLE —
/// something the player achieves through their own attendance/play/effort — per #108. Coach/family-granted
/// bonuses (player-of-training, fair play, family cheered) are deliberately absent.</summary>
public enum ChallengeMetric
{
    /// <summary>Present at training appointments.</summary>
    TrainingAttendance,
    /// <summary>Net goals scored (StatTracker).</summary>
    MatchGoal,
    /// <summary>Confirmed home-training logs (#104).</summary>
    HomeTraining,
    /// <summary>Skill grade improved over the previous rating (PlayerSkillRating).</summary>
    SkillImprovement,
    /// <summary>New personal record in a test (TestResult).</summary>
    TestPersonalRecord
}

/// <summary>The rolling period a challenge resets on — the idempotence window for a completion.</summary>
public enum ChallengeWindow { Week, Month, Season }

/// <summary>Each challenge's stable code — used as the completion key and the i18n key base
/// (challenge.{code}.title / .desc) on the client. Stored as its name string.</summary>
public enum ChallengeCode
{
    Train3PerWeek,
    ScoreInMatch,
    TwoHomeTrainings,
    ImproveSkill,
    TestRecord
}

/// <summary>
/// Static challenge definitions (#108), kept in code like <see cref="BadgeCatalog"/> / <see cref="XpRules"/>
/// rather than a DB table: targets/rewards are fixed placeholders and titles/descriptions are i18n keys on
/// the client, so nothing about a definition needs to live in SQL.
/// ponytail: flat const catalog; HeadCoach-configurable challenges are a later extension (like #106 for values).
/// </summary>
public static class ChallengeCatalog
{
    public record Def(ChallengeCode Code, ChallengeMetric Metric, int Target, ChallengeWindow Window, int RewardXp);

    public static readonly IReadOnlyList<Def> All =
    [
        new(ChallengeCode.Train3PerWeek,    ChallengeMetric.TrainingAttendance, 3, ChallengeWindow.Week,   30),
        new(ChallengeCode.ScoreInMatch,     ChallengeMetric.MatchGoal,          1, ChallengeWindow.Week,   20),
        new(ChallengeCode.TwoHomeTrainings, ChallengeMetric.HomeTraining,       2, ChallengeWindow.Week,   15),
        new(ChallengeCode.ImproveSkill,     ChallengeMetric.SkillImprovement,   1, ChallengeWindow.Month,  25),
        new(ChallengeCode.TestRecord,       ChallengeMetric.TestPersonalRecord, 1, ChallengeWindow.Season, 20),
    ];

    public static readonly IReadOnlyDictionary<string, Def> ByCode =
        All.ToDictionary(d => d.Code.ToString());
}
