namespace FloorballTraining.CoreBusiness;

public class TournamentMatch : BaseEntity
{
    public int TournamentId { get; set; }
    public Tournament? Tournament { get; set; }

    public int Round { get; set; }

    /// <summary>"rr" (round-robin) | "sf" (semifinal) | "3p" (3rd place) | "f" (final)</summary>
    public string Stage { get; set; } = "rr";

    public string? Field { get; set; }

    public int? HomeTeamId { get; set; }
    public TournamentTeam? HomeTeam { get; set; }

    public int? AwayTeamId { get; set; }
    public TournamentTeam? AwayTeam { get; set; }

    public bool Played { get; set; }

    public int HomeGoals { get; set; }
    public int AwayGoals { get; set; }
    public int HomeSpecialGoals { get; set; }
    public int AwaySpecialGoals { get; set; }

    public List<TournamentMatchTaskCompletion> TaskCompletions { get; set; } = [];
}
