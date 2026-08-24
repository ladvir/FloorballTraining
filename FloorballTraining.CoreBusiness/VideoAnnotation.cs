using FloorballTraining.CoreBusiness.Enums;

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

    /// <summary>
    /// Burned-in export (#141): renders the lines/freehand strokes into a standalone video file,
    /// saved as a new sibling <see cref="Video"/> under the same owner. Non-destructive — the
    /// original video and this analysis stay untouched and still editable.
    /// </summary>
    public VideoExportStatus ExportStatus { get; set; } = VideoExportStatus.None;
    public int? ExportedVideoId { get; set; }
    public Video? ExportedVideo { get; set; }
    public string? ExportError { get; set; }

    public string? CreatedByUserId { get; set; }
    public string? UpdatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
