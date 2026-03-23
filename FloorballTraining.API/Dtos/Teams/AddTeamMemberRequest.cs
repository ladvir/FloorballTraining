namespace FloorballTraining.API.Controllers;

public class AddTeamMemberRequest
{
    public int MemberId { get; set; }
    public bool IsCoach { get; set; }
    public bool IsPlayer { get; set; } = true;
}
