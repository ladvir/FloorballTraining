namespace FloorballTraining.CoreBusiness;

/// <summary>
/// One saved announcement in a user's personal Hlasatel (announcer) library. Purely per-user
/// scratch content — no club/team scope, no XP, no sharing. Replaces the browser-localStorage
/// library so it follows the user across devices.
/// </summary>
public class AnnouncerLibraryItem : BaseEntity
{
    /// <summary>Owner (AppUser id). Every query is filtered by this; a user only ever sees their own.</summary>
    public string UserId { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    /// <summary>The announcement text, including the *…* / !…! / CAPS / // markers.</summary>
    public string Text { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
