using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.CoreBusiness;

/// <summary>
/// Age/gender-scoped scale (#92) mapping a Number-type test's raw value to a skill grade
/// (1 best - 5 worst). Sibling of TestColourRange, same fallback resolution, but 5 bands
/// instead of 3 — grade 5 (worst) is implicit "else", same convention as the implicit red.
/// </summary>
public class TestSkillGradeRange : BaseEntity
{
    public int TestDefinitionId { get; set; }
    public TestDefinition? TestDefinition { get; set; }

    public int? AgeGroupId { get; set; }
    public AgeGroup? AgeGroup { get; set; }

    public Gender? Gender { get; set; }

    public double? Grade1From { get; set; }
    public double? Grade1To { get; set; }

    public double? Grade2From { get; set; }
    public double? Grade2To { get; set; }

    public double? Grade3From { get; set; }
    public double? Grade3To { get; set; }

    public double? Grade4From { get; set; }
    public double? Grade4To { get; set; }
}
