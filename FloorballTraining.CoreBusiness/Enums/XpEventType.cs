namespace FloorballTraining.CoreBusiness.Enums;

/// <summary>What a derived <see cref="XpEvent"/> rewards. Stored as int.</summary>
public enum XpEventType
{
    TrainingAttendance,
    MatchAttendance,
    Goal,
    Assist,
    PlusMinus,
    SkillGradeImprovement,
    SkillTargetReached,
    TestPersonalRecord,
    // Layer B — coach 1-click bonuses (#100), derived from XpCoachAward.
    PlayerOfTraining,
    FairPlay,
    FamilyCheered,
    // Layer C — capped self-report (#104), derived from a confirmed HomeTrainingLog.
    HomeTraining,
    // Etapa 6 — self-completable challenge bonus (#108), derived from a ChallengeCompletion.
    ChallengeReward
}
