namespace FloorballTraining.CoreBusiness.Dtos;

public class SeasonDto : BaseEntityDto
{
    public string Name { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; } 
    public List<TeamDto?> Teams { get; set; } = [];
    public bool IsCurrent => StartDate.Date <= DateTime.Today.Date && EndDate.Date >= DateTime.Today.Date;
}