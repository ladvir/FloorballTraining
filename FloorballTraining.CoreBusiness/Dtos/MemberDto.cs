using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.CoreBusiness.Dtos;

public class MemberDto : BaseEntityDto
{
    public string Name { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public ClubDto Club { get; set; } = null!;

    public int ClubId { get; set; }
    public ClubRole ClubRole { get; set; }

    public List<TeamMemberDto> MemberTeamMembers { get; set; } = new();
}
