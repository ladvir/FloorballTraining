using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.CoreBusiness;

public class TestColourRange : BaseEntity
{
    public int TestDefinitionId { get; set; }
    public TestDefinition? TestDefinition { get; set; }

    public int? AgeGroupId { get; set; }
    public AgeGroup? AgeGroup { get; set; }

    public Gender? Gender { get; set; }

    public double? GreenFrom { get; set; }
    public double? GreenTo { get; set; }

    public double? YellowFrom { get; set; }
    public double? YellowTo { get; set; }
}
