using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.CoreBusiness.Dtos;

public class VideoDto : BaseEntityDto
{
    public VideoType VideoType { get; set; }
    public string? Url { get; set; }
    public string? FilePath { get; set; }
    public string? Title { get; set; }
    public string? ThumbnailUrl { get; set; }
    public string? CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; }
}
