namespace FloorballTraining.CoreBusiness;

public class Tournament : BaseEntity
{
    public string Name { get; set; } = null!;

    /// <summary>"round-robin" | "round-robin-playoff"</summary>
    public string Format { get; set; } = "round-robin-playoff";

    public int SpecialGoalBonusPoints { get; set; } = 1;

    /// <summary>JSON array of field names, e.g. ["Hřiště 1","Hřiště 2"]</summary>
    public string FieldsJson { get; set; } = "[]";

    public int? ClubId { get; set; }
    public Club? Club { get; set; }

    public string? CreatedByUserId { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public List<TournamentTeam> Teams { get; set; } = [];
    public List<TournamentSpecialTask> SpecialTasks { get; set; } = [];
    public List<TournamentMatch> Matches { get; set; } = [];
}
