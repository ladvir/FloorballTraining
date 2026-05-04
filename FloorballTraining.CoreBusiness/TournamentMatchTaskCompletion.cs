namespace FloorballTraining.CoreBusiness;

public class TournamentMatchTaskCompletion : BaseEntity
{
    public int TournamentMatchId { get; set; }
    public TournamentMatch? TournamentMatch { get; set; }

    public int TournamentSpecialTaskId { get; set; }
    public TournamentSpecialTask? TournamentSpecialTask { get; set; }

    /// <summary>true = home team completed the task, false = away team</summary>
    public bool IsHome { get; set; }
}
