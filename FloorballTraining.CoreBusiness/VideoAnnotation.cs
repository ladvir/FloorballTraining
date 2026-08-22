namespace FloorballTraining.CoreBusiness;

/// <summary>
/// A coach's video-editor analysis for one <see cref="Video"/> — timed line/freehand drawings
/// plus an optional non-destructive trim window. One-to-one with the video (#137).
/// </summary>
public class VideoAnnotation : BaseEntity, IAuditable
{
    public int VideoId { get; set; }
    public Video? Video { get; set; }

    public int? TrimStartMs { get; set; }
    public int? TrimEndMs { get; set; }

    /// <summary>Serialized timed annotation state (same shape the video editor draws from).</summary>
    public string DataJson { get; set; } = string.Empty;

    public string? CreatedByUserId { get; set; }
    public string? UpdatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
