namespace FloorballTraining.CoreBusiness.Dtos;

public class ActivityDto : ActivityBaseDto
{
    /// <summary>
    /// Server-computed hint for the current caller: may they edit/delete this activity?
    /// Set by read endpoints (Get / all); mirrors ActivitiesController.CanModifyActivityAsync.
    /// Ignored on write.
    /// </summary>
    public bool CanEdit { get; set; }

    public List<ActivityTagDto> ActivityTags { get; set; } = new();

    public List<ActivityEquipmentDto> ActivityEquipments { get; set; } = new();

    public List<ActivityMediaDto> ActivityMedium { get; set; } = new();

    public List<ActivityAgeGroupDto> ActivityAgeGroups { get; set; } = new();

    public List<ActivitySkillDto> ActivitySkills { get; set; } = new();


     public List<string?> GetAgeGroupList()
        {
            return ActivityAgeGroups.Select(a=>a.AgeGroup?.Name).OrderBy(n => n).ToList() ?? [];
        }
    public string GetAgeGroupsAsString(string separator = ", ")
    {
        return string.Join(separator, GetAgeGroupList());
    }
}