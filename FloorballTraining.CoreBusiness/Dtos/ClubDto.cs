namespace FloorballTraining.CoreBusiness.Dtos;

public class ClubDto : BaseEntityDto
{
    public string Name { get; set; } = string.Empty;

    public List<TeamDto> Teams { get; set; } = new();

    public List<MemberDto>? Members { get; set; } = new();
}
