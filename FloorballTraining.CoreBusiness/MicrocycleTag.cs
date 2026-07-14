namespace FloorballTraining.CoreBusiness;

/// <summary>Goal tag of a microcycle (tags flagged IsTrainingGoal, max 3 per cycle).</summary>
public class MicrocycleTag
{
    public int Id { get; set; }
    public int MicrocycleId { get; set; }
    public int TagId { get; set; }

    public Microcycle? Microcycle { get; set; }
    public Tag? Tag { get; set; }
}
