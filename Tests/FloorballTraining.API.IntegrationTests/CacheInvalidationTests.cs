using System.Net;
using System.Net.Http.Json;

namespace FloorballTraining.API.IntegrationTests;

/// <summary>Verifies the reference cache (B7/#14) is evicted on a create so reads aren't stale.</summary>
[Collection("Api")]
public class CacheInvalidationTests : IAsyncLifetime
{
    private readonly CustomWebApplicationFactory _factory;
    private int? _createdTagId;

    public CacheInvalidationTests(CustomWebApplicationFactory factory) => _factory = factory;

    public Task InitializeAsync()
    {
        // Start each cache test with a cold cache so warm-up assumptions hold.
        _factory.ResetCache();
        return Task.CompletedTask;
    }

    public async Task DisposeAsync()
    {
        if (!_createdTagId.HasValue) return;

        var client = _factory.CreateClient();
        var token = await LoginHelper.GetAdminTokenAsync(client);
        client.DefaultRequestHeaders.Authorization = new("Bearer", token);
        var response = await client.DeleteAsync($"/Tags/{_createdTagId.Value}");
        if (response.StatusCode != System.Net.HttpStatusCode.NotFound)
            response.EnsureSuccessStatusCode();
    }

    private sealed class TagItem
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
    }

    [Fact]
    public async Task Creating_a_tag_invalidates_the_cached_tag_list()
    {
        var client = _factory.CreateClient();
        var token = await LoginHelper.GetAdminTokenAsync(client);
        client.DefaultRequestHeaders.Authorization = new("Bearer", token);

        // Warm the cache.
        var before = await client.GetFromJsonAsync<List<TagItem>>("/Tags/all");
        before.Should().NotBeNull();

        var newName = $"CacheTest-{Guid.NewGuid():N}";
        var create = await client.PostAsJsonAsync("/Tags", new { name = newName, color = "#abcdef" });
        create.StatusCode.Should().Be(HttpStatusCode.OK);
        var created = await create.Content.ReadFromJsonAsync<TagItem>();
        _createdTagId = created?.Id;

        // A stale cache would omit the new tag; eviction makes it appear.
        var after = await client.GetFromJsonAsync<List<TagItem>>("/Tags/all");
        after.Should().NotBeNull();
        after!.Select(t => t.Name).Should().Contain(newName);
    }
}
