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
        // Early return on HIT: single lookup, no double-read.
        if (cache.TryGetValue(key, out T? cached))
        {
            logger.LogDebug("Reference cache HIT {Key}", key);
            if (cached == null)
            {
                // Evict the poisoned entry so the next request retries the factory
                // rather than throwing for the remaining TTL.
                cache.Remove(key);
                throw new InvalidOperationException($"Reference cache contains null for key '{key}'.");
            }
            return cached;
        }

        // MISS: GetOrCreateAsync's internal per-entry lock coalesces concurrent cold misses
        // so only one factory call fires even when many requests arrive simultaneously.
        logger.LogDebug("Reference cache MISS {Key}", key);
        var value = await cache.GetOrCreateAsync(key, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow =
                TimeSpan.FromMinutes(_settings.ReferenceDataTtlMinutes);
            return await factory();
        });

        if (value == null)
        {
            cache.Remove(key);
            throw new InvalidOperationException($"Reference cache factory returned null for key '{key}'.");
        }
        return value;
    }

    public void Evict(string key)
    {
        cache.Remove(key);
        logger.LogDebug("Reference cache EVICT {Key}", key);
    }
}
