namespace FloorballTraining.CoreBusiness.Enums;

/// <summary>Which recorded entity a derived <see cref="XpEvent"/> came from. Stored as int.</summary>
public enum XpSourceKind
{
    Attendance,
    StatTrackerEntry,
    SkillRating,
    TestResult,
    /// <summary>Layer B — a coach-entered <see cref="FloorballTraining.CoreBusiness.XpCoachAward"/> (#100).</summary>
    CoachAward,
    /// <summary>A guardian's <see cref="FloorballTraining.CoreBusiness.FanCheckIn"/> at a match (#103).</summary>
    FanCheckIn,
    /// <summary>Layer C — a confirmed self-reported <see cref="FloorballTraining.CoreBusiness.HomeTrainingLog"/> (#104).</summary>
    HomeTraining
}
