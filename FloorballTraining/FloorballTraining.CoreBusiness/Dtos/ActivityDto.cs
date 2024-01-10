namespace FloorballTraining.CoreBusiness.Dtos;

public class ActivityDto : ActivityBaseDto
{
    public List<ActivityTagDto> ActivityTags { get; set; } = new();

    public List<EquipmentDto> ActivityEquipments { get; set; } = new();

    public List<ActivityMediaDto> ActivityMedium { get; set; } = new();

    public List<AgeGroupDto> ActivityAgeGroups { get; set; } = new();
}