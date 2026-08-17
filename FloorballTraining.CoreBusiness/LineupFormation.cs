namespace FloorballTraining.CoreBusiness;

public class LineupFormation : BaseEntity
{
    public int MatchLineupId { get; set; }
    public MatchLineup? MatchLineup { get; set; }

    public int Index { get; set; }

    public string? Label { get; set; }

    /// <summary>Tailwind color key: blue|emerald|amber|violet|pink.</summary>
    public string ColorKey { get; set; } = "blue";

    public List<LineupSlot> Slots { get; set; } = [];
}
