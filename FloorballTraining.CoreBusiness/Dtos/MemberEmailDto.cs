namespace FloorballTraining.CoreBusiness.Dtos;

public class MemberEmailDto : BaseEntityDto
{
    public string Name { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;
}