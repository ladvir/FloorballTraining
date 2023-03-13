using System.ComponentModel.DataAnnotations;

namespace TrainingDataAccess.Dtos;

public class ActivityDto
{
    public ActivityDto() { }

    public ActivityDto(ActivityDto activity)
    {
        ActivityId = activity.ActivityId;
        Name = activity.Name;
        Description = activity.Description;
        PersonsMin = activity.PersonsMin;
        PersonsMax = activity.PersonsMax;
        DurationMin = activity.DurationMin;
        DurationMax = activity.DurationMax;
        TagIds = new List<int>(activity.TagIds);
    }

    public int ActivityId { get; set; }

    [Required(AllowEmptyStrings = false, ErrorMessage = "Zadejte název aktivity")]
    [StringLength(50, ErrorMessage = "Název musí mít alespoň 3 a maximálně 50 znaků", MinimumLength = 3)]
    public string Name { get; set; } = string.Empty;

    [StringLength(500, ErrorMessage = "Popis může mít maximálně 500 znaků")]
    public string? Description { get; set; }

    public int? PersonsMin { get; set; }
    public int? PersonsMax { get; set; }
    public int? DurationMin { get; set; }
    public int? DurationMax { get; set; }
    public List<int> TagIds { get; set; } = new List<int>();


}