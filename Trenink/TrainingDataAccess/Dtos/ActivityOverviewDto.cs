using System.ComponentModel.DataAnnotations;

namespace TrainingDataAccess.Dtos;

public class ActivityOverviewDto
{
    public ActivityOverviewDto() { }

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
    public List<TagDto> Tags { get; set; } = new List<TagDto>();

}