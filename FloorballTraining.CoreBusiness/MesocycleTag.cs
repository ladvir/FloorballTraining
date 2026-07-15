namespace FloorballTraining.CoreBusiness;

/// <summary>Goal tag of a mesocycle (tags flagged IsTrainingGoal, max 3 per cycle).</summary>
public class MesocycleTag
{
    public int Id { get; set; }
    public int MesocycleId { get; set; }
    public int TagId { get; set; }

    public Mesocycle? Mesocycle { get; set; }
    public Tag? Tag { get; set; }
}
