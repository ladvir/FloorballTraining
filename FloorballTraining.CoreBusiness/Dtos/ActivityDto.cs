namespace FloorballTraining.CoreBusiness.Dtos;

public class ActivityDto : ActivityBaseDto
{
    public List<ActivityTagDto> ActivityTags { get; set; } = new();

    public List<ActivityEquipmentDto> ActivityEquipments { get; set; } = new();

    public List<ActivityMediaDto> ActivityMedium { get; set; } = new();

    public List<ActivityAgeGroupDto> ActivityAgeGroups { get; set; } = new();
    
    
     public List<string?> GetAgeGroupList()
        {
            return ActivityAgeGroups.Select(a=>a.AgeGroup?.Name).OrderBy(n => n).ToList() ?? [];
        }
    public string GetAgeGroupsAsString(string separator = ", ")
    {
        return string.Join(separator, GetAgeGroupList());
    }
}