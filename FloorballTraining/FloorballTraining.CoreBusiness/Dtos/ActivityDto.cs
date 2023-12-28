namespace FloorballTraining.CoreBusiness.Dtos;

public class ActivityDto : ActivityBaseDto
{
    public List<TagDto> ActivityTags { get; set; } = new();

    public List<EquipmentDto> ActivityEquipments { get; set; } = new();

    //public List<MediaDto> ActivityMedium { get; set; } = new();

    public List<AgeGroupDto> ActivityAgeGroups { get; set; } = new();
}