namespace FloorballTraining.CoreBusiness;

public class StatTrackerParticipant : BaseEntity
{
    public int StatTrackerId { get; set; }
    public StatTracker? StatTracker { get; set; }

    public int MemberId { get; set; }
    public Member? Member { get; set; }

    /// <summary>0 = Player, 1 = Goalkeeper</summary>
    public int Role { get; set; }

    public int SortOrder { get; set; }
}
