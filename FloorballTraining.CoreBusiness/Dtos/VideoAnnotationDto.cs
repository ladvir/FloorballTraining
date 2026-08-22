namespace FloorballTraining.CoreBusiness.Dtos;

public class VideoAnnotationDto : BaseEntityDto
{
    public int VideoId { get; set; }
    public int? TrimStartMs { get; set; }
    public int? TrimEndMs { get; set; }
    public string DataJson { get; set; } = string.Empty;
    public DateTime? UpdatedAt { get; set; }
}
