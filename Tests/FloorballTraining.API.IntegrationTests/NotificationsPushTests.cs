using FloorballTraining.Plugins.EFCoreSqlServer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Net;
using System.Net.Http.Json;

namespace FloorballTraining.API.IntegrationTests;

/// <summary>
/// Covers Web Push subscription management (#37): subscribe upserts by endpoint,
/// unsubscribe removes only the caller's own subscription, and the VAPID public key
/// is exposed for the client to build a subscription.
/// </summary>
[Collection("Api")]
public class NotificationsPushTests : IAsyncLifetime
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly List<string> _endpointsToDelete = new();

    public NotificationsPushTests(CustomWebApplicationFactory factory) => _factory = factory;

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync()
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var dbFactory = scope.ServiceProvider.GetRequiredService<IDbContextFactory<FloorballTrainingContext>>();
        await using var db = await dbFactory.CreateDbContextAsync();
        var stray = await db.PushSubscriptions.Where(s => _endpointsToDelete.Contains(s.Endpoint)).ToListAsync();
        db.PushSubscriptions.RemoveRange(stray);
        await db.SaveChangesAsync();
    }

    private async Task<HttpClient> AdminClientAsync()
    {
        var client = _factory.CreateClient();
        var token = await LoginHelper.GetAdminTokenAsync(client);
        client.DefaultRequestHeaders.Authorization = new("Bearer", token);
        return client;
    }

    [Fact]
    public async Task GetVapidPublicKey_returns_configured_key()
    {
        var client = await AdminClientAsync();

        var resp = await client.GetAsync("/notifications/vapid-public-key");
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await resp.Content.ReadFromJsonAsync<Dictionary<string, string>>();
        body!["publicKey"].Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task PushSubscribe_then_Unsubscribe_roundtrips()
    {
        var endpoint = $"https://push.example/{Guid.NewGuid():N}";
        _endpointsToDelete.Add(endpoint);
        var client = await AdminClientAsync();

        var subscribe = await client.PostAsJsonAsync("/notifications/push-subscribe",
            new { Endpoint = endpoint, P256dh = "p256dh-key", Auth = "auth-key" });
        subscribe.StatusCode.Should().Be(HttpStatusCode.NoContent);

        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var dbFactory = scope.ServiceProvider.GetRequiredService<IDbContextFactory<FloorballTrainingContext>>();
            await using var db = await dbFactory.CreateDbContextAsync();
            (await db.PushSubscriptions.SingleOrDefaultAsync(s => s.Endpoint == endpoint))
                .Should().NotBeNull();
        }

        var unsubscribe = await client.SendAsync(new HttpRequestMessage(HttpMethod.Delete, "/notifications/push-unsubscribe")
        {
            Content = JsonContent.Create(new { Endpoint = endpoint }),
        });
        unsubscribe.StatusCode.Should().Be(HttpStatusCode.NoContent);

        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var dbFactory = scope.ServiceProvider.GetRequiredService<IDbContextFactory<FloorballTrainingContext>>();
            await using var db = await dbFactory.CreateDbContextAsync();
            (await db.PushSubscriptions.AnyAsync(s => s.Endpoint == endpoint)).Should().BeFalse();
        }
    }

    [Fact]
    public async Task PushSubscribe_upserts_by_endpoint_instead_of_duplicating()
    {
        var endpoint = $"https://push.example/{Guid.NewGuid():N}";
        _endpointsToDelete.Add(endpoint);
        var client = await AdminClientAsync();

        await client.PostAsJsonAsync("/notifications/push-subscribe",
            new { Endpoint = endpoint, P256dh = "old-key", Auth = "old-auth" });
        var second = await client.PostAsJsonAsync("/notifications/push-subscribe",
            new { Endpoint = endpoint, P256dh = "new-key", Auth = "new-auth" });
        second.StatusCode.Should().Be(HttpStatusCode.NoContent);

        await using var scope = _factory.Services.CreateAsyncScope();
        var dbFactory = scope.ServiceProvider.GetRequiredService<IDbContextFactory<FloorballTrainingContext>>();
        await using var db = await dbFactory.CreateDbContextAsync();
        var rows = await db.PushSubscriptions.Where(s => s.Endpoint == endpoint).ToListAsync();
        rows.Should().ContainSingle();
        rows[0].P256dh.Should().Be("new-key");
    }

    [Fact]
    public async Task PushUnsubscribe_does_not_remove_another_users_subscription()
    {
        var endpoint = $"https://push.example/{Guid.NewGuid():N}";
        _endpointsToDelete.Add(endpoint);
        var admin = await AdminClientAsync();
        await admin.PostAsJsonAsync("/notifications/push-subscribe",
            new { Endpoint = endpoint, P256dh = "p256dh-key", Auth = "auth-key" });

        var email = $"push-{Guid.NewGuid():N}@test.example";
        const string password = "Test123!";
        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var um = scope.ServiceProvider.GetRequiredService<Microsoft.AspNetCore.Identity.UserManager<
                FloorballTraining.Plugins.EFCoreSqlServer.Models.AppUser>>();
            var user = new FloorballTraining.Plugins.EFCoreSqlServer.Models.AppUser
            {
                UserName = email, Email = email, FirstName = "Push", LastName = "Tester",
            };
            (await um.CreateAsync(user, password)).Succeeded.Should().BeTrue();
        }

        var otherClient = _factory.CreateClient();
        var token = await LoginHelper.GetTokenAsync(otherClient, email, password);
        otherClient.DefaultRequestHeaders.Authorization = new("Bearer", token);

        var unsubscribe = await otherClient.SendAsync(new HttpRequestMessage(HttpMethod.Delete, "/notifications/push-unsubscribe")
        {
            Content = JsonContent.Create(new { Endpoint = endpoint }),
        });
        unsubscribe.StatusCode.Should().Be(HttpStatusCode.NoContent);

        await using var scope2 = _factory.Services.CreateAsyncScope();
        var dbFactory = scope2.ServiceProvider.GetRequiredService<IDbContextFactory<FloorballTrainingContext>>();
        await using var db = await dbFactory.CreateDbContextAsync();
        (await db.PushSubscriptions.AnyAsync(s => s.Endpoint == endpoint)).Should().BeTrue();

        var um2 = scope2.ServiceProvider.GetRequiredService<Microsoft.AspNetCore.Identity.UserManager<
            FloorballTraining.Plugins.EFCoreSqlServer.Models.AppUser>>();
        var user2 = await um2.FindByEmailAsync(email);
        if (user2 != null) await um2.DeleteAsync(user2);
    }
}
