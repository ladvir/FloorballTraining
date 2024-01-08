using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.CoreBusiness;

public class ActivityMediaDto : BaseEntityDto
{
    public int ActivityId { get; set; }

    public string Path { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public MediaType MediaType { get; set; }

    public string Preview { get; set; } = string.Empty;

    public string Data { get; set; } = string.Empty;


    public ActivityMediaDto Clone()
    {
        return new ActivityMediaDto
        {
            Id = Id,
            ActivityId = ActivityId,
            Path = Path,
            Name = Name,
            MediaType = MediaType,
            Preview = Preview,
            Data = Data
        };
    }
}