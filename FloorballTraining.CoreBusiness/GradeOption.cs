namespace FloorballTraining.CoreBusiness;

public class GradeOption : BaseEntity
{
    public int TestDefinitionId { get; set; }
    public TestDefinition? TestDefinition { get; set; }

    public string Label { get; set; } = string.Empty;

    public int NumericValue { get; set; }

    public string? Colour { get; set; }

    public int SortOrder { get; set; }
}
