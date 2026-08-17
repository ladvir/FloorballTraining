namespace FloorballTraining.CoreBusiness;

public class TestResult : BaseEntity
{
    public int TestDefinitionId { get; set; }
    public TestDefinition? TestDefinition { get; set; }

    public int MemberId { get; set; }
    public Member? Member { get; set; }

    public double? NumericValue { get; set; }

    public int? GradeOptionId { get; set; }
    public GradeOption? GradeOption { get; set; }

    public DateTime TestDate { get; set; }

    public string? Note { get; set; }

    public string RecordedByUserId { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
