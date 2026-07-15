namespace FloorballTraining.API.Controllers;

public class CopyTeamToSeasonRequest
{
    public int SeasonId { get; set; }
    public string? NewName { get; set; }
    public bool CopyMembers { get; set; } = true;
    /// <summary>Also clone the season plan (mesocycles/microcycles/goal tags/recommended trainings),
    /// shifted by the difference of the season start dates.</summary>
    public bool CopyPlan { get; set; }
}
