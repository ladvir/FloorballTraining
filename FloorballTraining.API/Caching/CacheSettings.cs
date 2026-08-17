namespace FloorballTraining.API.Caching;

/// <summary>Bound from the "CacheSettings" section of appsettings.json.</summary>
public class CacheSettings
{
    /// <summary>TTL (minutes) for cached reference lists (tags, equipment, age groups, places).</summary>
    public int ReferenceDataTtlMinutes { get; set; } = 15;
}
