namespace FloorballTraining.CoreBusiness.Dtos;

public class TeamDto : BaseEntityDto
{
    public string Name { get; set; } = null!;

    public AgeGroupDto AgeGroup { get; set; } = null!;

    public ClubDto Club { get; set; } = null!;
    public int ClubId { get; set; }

    public List<TeamTrainingDto> TeamTrainings { get; set; } = new();
    public List<TeamMemberDto> TeamMembers { get; set; } = new();
}
