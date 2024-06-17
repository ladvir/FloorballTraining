using System.Text;

namespace FloorballTraining.CoreBusiness.Dtos;

public class MemberDto : BaseEntityDto
{
    public string Name { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public ClubDto Club { get; set; } = null!;

    public int ClubId { get; set; }
    public bool HasClubRoleManager { get; set; }
    public bool HasClubRoleSecretary { get; set; }
    public bool HasClubRoleMainCoach { get; set; }

    public List<TeamMemberDto> MemberTeamMembers { get; set; } = new();

    public string GetClubRoleList()
    {
        var sb = new StringBuilder();

        var roles = new List<string>();

        if (HasClubRoleManager) roles.Add("manažer");
        if (HasClubRoleSecretary) roles.Add("sekretář");
        if (HasClubRoleMainCoach) roles.Add("hlavní trenér");

        return sb.AppendJoin(", ", roles).ToString();
    }

    public string GetTeamRoleList()
    {
        //var teamMembers = MemberTeamMembers.Select(mtm => new { mtm.Team.Name, mtm.IsCoach, mtm.IsPlayer });

        var teamMembers = Club.Teams.SelectMany(x => x.TeamMembers.Where(tm => tm.MemberId == Id).Select(mtm => new { mtm.Team.Name, mtm.IsCoach, mtm.IsPlayer }));

        if (!teamMembers.Any()) return string.Empty;

        var sb = new StringBuilder();
        sb.AppendJoin(", ", teamMembers.Select(s => $"{s.Name} ({TeamRole(s.IsCoach, s.IsPlayer)}) "));
        return sb.ToString();
    }

    private string TeamRole(bool isCoach, bool isPlayer)
    {
        return isCoach switch
        {
            true when isPlayer => "trenér, hráč",
            true when !isPlayer => "trenér",
            false when isPlayer => "hráč",
            _ => string.Empty
        };
    }
}
