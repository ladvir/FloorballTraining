namespace FloorballTraining.CoreBusiness;

public class AgeGroup
{
    public const string Kdokoliv = "Kdokoliv";

    public int AgeGroupId { get; set; }
    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public List<ActivityAgeGroup> ActivityAgeGroups { get; set; } = new();

    public List<TrainingAgeGroup> TrainingAgeGroups { get; set; } = new();
    public bool IsKdokoliv()
    {
        return Name == Kdokoliv;
    }
}