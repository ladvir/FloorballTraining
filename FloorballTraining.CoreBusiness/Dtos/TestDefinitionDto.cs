using System.ComponentModel.DataAnnotations.Schema;
using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.CoreBusiness.Dtos;

[NotMapped]
public class TestDefinitionDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public TestType TestType { get; set; }
    public TestCategory Category { get; set; }
    public string? Unit { get; set; }
    public bool HigherIsBetter { get; set; }
    public int? ClubId { get; set; }
    public bool IsTemplate { get; set; }
    public int SortOrder { get; set; }
    /// <summary>Skill this test informs, if any (#92).</summary>
    public int? SkillId { get; set; }
    public string? SkillName { get; set; }
    public string? SkillCategoryName { get; set; }
    public List<GradeOptionDto> GradeOptions { get; set; } = new();
    public List<TestColourRangeDto> ColourRanges { get; set; } = new();
    public List<TestSkillGradeRangeDto> SkillGradeRanges { get; set; } = new();
    public int ResultCount { get; set; }
}

[NotMapped]
public class GradeOptionDto
{
    public int Id { get; set; }
    public int TestDefinitionId { get; set; }
    public string Label { get; set; } = string.Empty;
    public int NumericValue { get; set; }
    public string? Colour { get; set; }
    public int SortOrder { get; set; }
    /// <summary>Fixed skill grade (1-5) this option implies, when the test is linked to a Skill (#92).</summary>
    public int? SkillGrade { get; set; }
}

[NotMapped]
public class TestColourRangeDto
{
    public int Id { get; set; }
    public int TestDefinitionId { get; set; }
    public int? AgeGroupId { get; set; }
    public string? AgeGroupName { get; set; }
    public Gender? Gender { get; set; }
    public double? GreenFrom { get; set; }
    public double? GreenTo { get; set; }
    public double? YellowFrom { get; set; }
    public double? YellowTo { get; set; }
}

/// <summary>Age/gender-scoped scale mapping a Number-type test's value to a skill grade (#92) — sibling of TestColourRangeDto.</summary>
[NotMapped]
public class TestSkillGradeRangeDto
{
    public int Id { get; set; }
    public int TestDefinitionId { get; set; }
    public int? AgeGroupId { get; set; }
    public string? AgeGroupName { get; set; }
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
