using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace FloorballTraining.API.Caching;

public class ReferenceCache(
    IMemoryCache cache,
    IOptions<CacheSettings> options,
    ILogger<ReferenceCache> logger) : IReferenceCache
{
    private readonly CacheSettings _settings = options.Value;

    public async Task<T> GetOrCreateAsync<T>(string key, Func<Task<T>> factory)
    {
        if (cache.TryGetValue(key, out T? cached))
        {
            logger.LogDebug("Reference cache HIT {Key}", key);
            return cached!;
        }

        logger.LogDebug("Reference cache MISS {Key}", key);
        var value = await factory();
        cache.Set(key, value, TimeSpan.FromMinutes(_settings.ReferenceDataTtlMinutes));
        return value;
    }

    public void Evict(string key)
    {
        cache.Remove(key);
        logger.LogDebug("Reference cache EVICT {Key}", key);
    }
}
