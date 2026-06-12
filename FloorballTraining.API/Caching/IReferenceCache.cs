namespace FloorballTraining.API.Caching;

/// <summary>
/// In-process cache for rarely-changing reference data. Entries expire after a configurable
/// TTL and are evicted explicitly when the underlying entity is created/updated/deleted.
/// </summary>
public interface IReferenceCache
{
    Task<T> GetOrCreateAsync<T>(string key, Func<Task<T>> factory);
    void Evict(string key);
}
