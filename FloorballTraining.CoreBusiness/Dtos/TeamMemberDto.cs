using System.Text;

namespace FloorballTraining.CoreBusiness.Dtos;

public class TeamMemberDto : BaseEntityDto
{

    public int? TeamId { get; set; }
    public TeamDto Team { get; set; } = null!;

    public bool IsCoach { get; set; }
    public bool IsPlayer { get; set; }

    public int? MemberId { get; set; }
    public MemberDto? Member { get; set; }

    public string GetRoleList()
    {
        var sb = new StringBuilder();

        var roles = new List<string>();

        if (IsCoach) roles.Add("Trenér");
        if (IsPlayer) roles.Add("Hráč");

        return sb.AppendJoin(", ", roles).ToString();
    }
}
