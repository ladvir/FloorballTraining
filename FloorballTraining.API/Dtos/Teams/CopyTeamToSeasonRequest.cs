namespace FloorballTraining.API.Controllers;

public class CopyTeamToSeasonRequest
{
    public int SeasonId { get; set; }
    public string? NewName { get; set; }
    public bool CopyMembers { get; set; } = true;
}
