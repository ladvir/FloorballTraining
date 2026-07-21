using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.CoreBusiness;

public class TestDefinition : BaseEntity
{
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    public TestType TestType { get; set; }

    public TestCategory Category { get; set; }

    public string? Unit { get; set; }

    public bool HigherIsBetter { get; set; }

    public int? ClubId { get; set; }
    public Club? Club { get; set; }

    public bool IsTemplate { get; set; }

    public int SortOrder { get; set; }

    /// <summary>Skill this test informs, if any (#92). Most tests are unlinked.</summary>
    public int? SkillId { get; set; }
    public Skill? Skill { get; set; }

    public List<GradeOption> GradeOptions { get; set; } = new();

    public List<TestColourRange> ColourRanges { get; set; } = new();

    public List<TestSkillGradeRange> SkillGradeRanges { get; set; } = new();

    public List<TestResult> Results { get; set; } = new();
}
