namespace FloorballTraining.CoreBusiness.Dtos;

/// <summary>
/// Best-effort metadata of a shared Instagram/Facebook post (Open Graph tags).
/// Every field except <see cref="Url"/> and <see cref="Source"/> may be null — Meta
/// frequently answers with a login wall, in which case only the link itself is known.
/// </summary>
public class LinkPreviewDto
{
    public string Url { get; set; } = string.Empty;

    /// <summary>"instagram" or "facebook".</summary>
    public string Source { get; set; } = string.Empty;

    public string? Title { get; set; }
    public string? Description { get; set; }

    /// <summary>Post caption extracted from og:description/og:title when recognizable.</summary>
    public string? Caption { get; set; }

    public string? ImageUrl { get; set; }
}
