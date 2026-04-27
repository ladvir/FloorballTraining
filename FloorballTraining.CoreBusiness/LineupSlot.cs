using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.CoreBusiness;

public class LineupSlot : BaseEntity
{
    public int LineupFormationId { get; set; }
    public LineupFormation? LineupFormation { get; set; }

    public SlotPosition Position { get; set; }

    public int? RosterId { get; set; }
    public LineupRoster? Roster { get; set; }
}
