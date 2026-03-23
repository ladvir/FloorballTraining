namespace FloorballTraining.CoreBusiness.Dtos;

public class TeamDto : BaseEntityDto
{
    public string Name { get; set; } = null!;

    public AgeGroupDto AgeGroup { get; set; } = null!;
    public int AgeGroupId { get; set; }

    public ClubDto Club { get; set; } = new();
    public int ClubId { get; set; }

    public int? SeasonId { get; set; }

    public int? PersonsMin { get; set; }
    public int? PersonsMax { get; set; }
    public int? DefaultTrainingDuration { get; set; }
    public int? MaxTrainingDuration { get; set; }
    public int? MaxTrainingPartDuration { get; set; }
    public int? MinPartsDurationPercent { get; set; }

    public string? ICalUrl { get; set; }

    public List<AppointmentDto> Appointments { get; set; } = new();
    public List<TeamMemberDto> TeamMembers { get; set; } = new();
}
