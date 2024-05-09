using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.CoreBusiness.Dtos;

public class TeamMemberDto : BaseEntityDto
{

    public int? TeamId { get; set; }
    public TeamDto? Team { get; set; } = null!;

    public TeamRole TeamRole { get; set; }

    public int? MemberId { get; set; }
    public MemberDto? Member { get; set; } = null!;
}
