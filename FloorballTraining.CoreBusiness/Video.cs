using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.CoreBusiness;

public class Video : BaseEntity, IAuditable
{
    public int? ActivityId { get; set; }
    public Activity? Activity { get; set; }

    public int? TrainingId { get; set; }
    public Training? Training { get; set; }

    public int? AppointmentId { get; set; }
    public Appointment? Appointment { get; set; }

    public VideoType VideoType { get; set; }

    /// <summary>Original URL for link types (YouTube/Instagram/OtherLink).</summary>
    public string? Url { get; set; }

    /// <summary>Storage-relative path for UploadedFile.</summary>
    public string? FilePath { get; set; }

    public string? Title { get; set; }
    public string? ThumbnailUrl { get; set; }

    public string? CreatedByUserId { get; set; }
    public string? UpdatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public bool HasExactlyOneOwner()
        => new[] { ActivityId.HasValue, TrainingId.HasValue, AppointmentId.HasValue }.Count(x => x) == 1;

    public bool HasValidUrlOrFilePath()
        => VideoType == VideoType.UploadedFile
            ? !string.IsNullOrWhiteSpace(FilePath) && string.IsNullOrWhiteSpace(Url)
            : !string.IsNullOrWhiteSpace(Url) && string.IsNullOrWhiteSpace(FilePath);
}
