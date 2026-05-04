namespace FloorballTraining.CoreBusiness;

public class TournamentSpecialTask : BaseEntity
{
    public int TournamentId { get; set; }
    public Tournament? Tournament { get; set; }

    public string Name { get; set; } = null!;
    public int BonusPoints { get; set; }
}
