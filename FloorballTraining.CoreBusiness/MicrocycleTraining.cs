namespace FloorballTraining.CoreBusiness;

/// <summary>Recommended training from the library attached to a microcycle.</summary>
public class MicrocycleTraining
{
    public int Id { get; set; }
    public int MicrocycleId { get; set; }
    public int TrainingId { get; set; }
    public string? Note { get; set; }
    public int SortOrder { get; set; }

    public Microcycle? Microcycle { get; set; }
    public Training? Training { get; set; }
}
