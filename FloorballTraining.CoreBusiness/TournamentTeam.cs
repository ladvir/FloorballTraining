namespace FloorballTraining.CoreBusiness;

public class TournamentTeam : BaseEntity
{
    public int TournamentId { get; set; }
    public Tournament? Tournament { get; set; }

    public string Name { get; set; } = null!;
    public int SortOrder { get; set; }
}
