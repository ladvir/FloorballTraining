using System.ComponentModel.DataAnnotations;

namespace FloorballTraining.CoreBusiness;

public class AgeGroup
{
    public const string Kdokoliv = "Kdokoliv";

    [Key]
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public List<ActivityAgeGroup> ActivityAgeGroups { get; set; } = new();

    public List<TrainingAgeGroup> TrainingAgeGroups { get; set; } = new();
    public bool IsKdokoliv()
    {
        return Name == Kdokoliv;
    }
}