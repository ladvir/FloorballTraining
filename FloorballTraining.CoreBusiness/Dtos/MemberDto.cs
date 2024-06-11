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

    public string GetRoleList()
    {
        var sb = new StringBuilder();

        var roles = new List<string>();

        if (HasClubRoleManager) roles.Add("Manažer");
        if (HasClubRoleSecretary) roles.Add("Sekretář");
        if (HasClubRoleMainCoach) roles.Add("Hlavní trenér");

        return sb.AppendJoin(", ", roles).ToString();
    }
}
