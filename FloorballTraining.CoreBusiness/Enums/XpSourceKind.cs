namespace FloorballTraining.CoreBusiness.Enums;

/// <summary>Which recorded entity a derived <see cref="XpEvent"/> came from. Stored as int.</summary>
public enum XpSourceKind
{
    Attendance,
    StatTrackerEntry,
    SkillRating,
    TestResult
}
