namespace FloorballTraining.CoreBusiness.Dtos;

public class OpponentDto : BaseEntityDto
{
    public string Name { get; set; } = string.Empty;
    public int ClubId { get; set; }
}
