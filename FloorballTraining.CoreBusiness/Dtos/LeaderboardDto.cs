namespace FloorballTraining.CoreBusiness.Dtos;

/// <summary>
/// A club or team leaderboard (#98). Rows are ranked by seasonal XP by default (fair — younger/newer
/// players aren't buried under lifetime XP) or by lifetime XP when <see cref="Sort"/> is "career".
/// </summary>
public class LeaderboardDto
{
    /// <summary>Season the seasonal column is computed for (the club's current/latest, or the requested one).</summary>
    public int? SeasonId { get; set; }
    /// <summary>"season" (default) or "career".</summary>
    public string Sort { get; set; } = "season";
    public List<LeaderboardRowDto> Rows { get; set; } = [];
    /// <summary>Top XP gainer over the trailing 30 days in this scope; null if nobody gained XP. Player of the month.</summary>
    public LeaderboardRowDto? PlayerOfMonth { get; set; }
}

public class LeaderboardRowDto
{
    /// <summary>1-based position in the current sort.</summary>
    public int Position { get; set; }
    public int MemberId { get; set; }
    public string Name { get; set; } = "";
    public int BirthYear { get; set; }
    public int SeasonXp { get; set; }
    /// <summary>Seasonal form 1..5 from <see cref="SeasonXp"/>.</summary>
    public int Stars { get; set; }
    public int LifetimeXp { get; set; }
    public string CareerRank { get; set; } = "";
    public int CareerRankIndex { get; set; }
    /// <summary>XP gained in the player-of-the-month window; only meaningful on <see cref="LeaderboardDto.PlayerOfMonth"/>.</summary>
    public int RecentXp { get; set; }
}
