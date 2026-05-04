namespace FloorballTraining.CoreBusiness.Dtos;

public class TournamentDto : BaseEntityDto
{
    public string Name { get; set; } = null!;
    public string Format { get; set; } = "round-robin-playoff";
    public int SpecialGoalBonusPoints { get; set; } = 1;
    public List<string> Fields { get; set; } = [];

    public int? ClubId { get; set; }

    public string? CreatedByUserId { get; set; }
    public string? CreatedByUserName { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public List<TournamentTeamDto> Teams { get; set; } = [];
    public List<TournamentSpecialTaskDto> SpecialTasks { get; set; } = [];
    public List<TournamentMatchDto> Matches { get; set; } = [];
}

public class TournamentTeamDto : BaseEntityDto
{
    public string Name { get; set; } = null!;
    public int SortOrder { get; set; }
}

public class TournamentSpecialTaskDto : BaseEntityDto
{
    public string Name { get; set; } = null!;
    public int BonusPoints { get; set; }
}

public class TournamentMatchDto : BaseEntityDto
{
    public int Round { get; set; }
    public string Stage { get; set; } = "rr";
    public string? Field { get; set; }

    public int? HomeTeamId { get; set; }
    public int? AwayTeamId { get; set; }

    public bool Played { get; set; }

    public int HomeGoals { get; set; }
    public int AwayGoals { get; set; }
    public int HomeSpecialGoals { get; set; }
    public int AwaySpecialGoals { get; set; }

    public List<int> HomeTaskIds { get; set; } = [];
    public List<int> AwayTaskIds { get; set; } = [];
}
