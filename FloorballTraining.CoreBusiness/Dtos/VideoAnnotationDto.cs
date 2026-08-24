using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.CoreBusiness.Dtos;

public class VideoAnnotationDto : BaseEntityDto
{
    public int VideoId { get; set; }
    public int? TrimStartMs { get; set; }
    public int? TrimEndMs { get; set; }
    public string DataJson { get; set; } = string.Empty;
    public VideoExportStatus ExportStatus { get; set; }
    public int? ExportedVideoId { get; set; }
    public string? ExportError { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
