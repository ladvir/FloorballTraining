using FloorballTraining.CoreBusiness;
using FloorballTraining.Plugins.EFCoreSqlServer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Net;
using System.Net.Http.Json;

namespace FloorballTraining.API.IntegrationTests;

/// <summary>
/// Regression guard for the iCal-import cache-invalidation fix: when iCal import creates a
/// new Place, the /Places/all cache must be evicted so the next read returns fresh data.
/// Before the fix, the imported place was invisible until the cache TTL expired.
/// </summary>
[Collection("Api")]
public class ICalCacheInvalidationTests : IAsyncLifetime
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly string _newPlaceName = $"TestHall-{Guid.NewGuid():N}";
    private readonly string _stubICalUrl = $"https://ical-stub.test/{Guid.NewGuid():N}.ics";
    private int _teamId;
    private int _clubId;

    public ICalCacheInvalidationTests(CustomWebApplicationFactory factory) => _factory = factory;

    public async Task InitializeAsync()
    {
        _factory.ResetCache();

        await using var scope = _factory.Services.CreateAsyncScope();
        var dbFactory = scope.ServiceProvider.GetRequiredService<IDbContextFactory<FloorballTrainingContext>>();
        await using var db = await dbFactory.CreateDbContextAsync();

        // AgeGroupId=1 (AnyAge) is seeded via EF HasData in FloorballTrainingContext.
        var club = new Club { Name = $"ICalTestClub-{Guid.NewGuid():N}" };
        db.Clubs.Add(club);
        await db.SaveChangesAsync();
        _clubId = club.Id;

        var team = new Team { Name = $"ICalTestTeam-{Guid.NewGuid():N}", ClubId = _clubId, AgeGroupId = 1 };
        db.Teams.Add(team);
        await db.SaveChangesAsync();
        _teamId = team.Id;

        // Register the stub iCal feed with a future event at the new place.
        // DtStart must be >= today so the import cutoff filter keeps the event.
        var ical = BuildICalFeed(_newPlaceName);
        _factory.HttpStubs[_stubICalUrl] = ical;
    }

    public async Task DisposeAsync()
    {
        // Remove stub so subsequent tests don't see it
        _factory.HttpStubs.TryRemove(_stubICalUrl, out _);

        await using var scope = _factory.Services.CreateAsyncScope();
        var dbFactory = scope.ServiceProvider.GetRequiredService<IDbContextFactory<FloorballTrainingContext>>();
        await using var db = await dbFactory.CreateDbContextAsync();

        // Remove appointments → team → club (FK order)
        var appointments = await db.Appointments.Where(a => a.TeamId == _teamId).ToListAsync();
        db.Appointments.RemoveRange(appointments);

        var newPlace = await db.Places.FirstOrDefaultAsync(p => p.Name == _newPlaceName);
        if (newPlace != null) db.Places.Remove(newPlace);

        var team = await db.Teams.FindAsync(_teamId);
        if (team != null) db.Teams.Remove(team);

        var club = await db.Clubs.FindAsync(_clubId);
        if (club != null) db.Clubs.Remove(club);

        await db.SaveChangesAsync();
    }

    [Fact]
    public async Task ICalImport_creating_new_place_evicts_places_cache()
    {
        var client = _factory.CreateClient();
        var token = await LoginHelper.GetAdminTokenAsync(client);
        client.DefaultRequestHeaders.Authorization = new("Bearer", token);

        // Warm the /Places/all cache so we know the new place isn't in it yet.
        var before = await client.GetFromJsonAsync<List<PlaceItem>>("/Places/all");
        before.Should().NotBeNull();
        before!.Select(p => p.Name).Should().NotContain(_newPlaceName,
            "the place does not exist yet and must not be in the initial cache");

        // Trigger iCal import — the service will fetch the stub URL and create the new place.
        var importResponse = await client.PostAsJsonAsync("/Appointments/import-ical",
            new { Url = _stubICalUrl, TeamId = _teamId });
        importResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        // If the cache was evicted, the new place must now appear.
        var after = await client.GetFromJsonAsync<List<PlaceItem>>("/Places/all");
        after.Should().NotBeNull();
        after!.Select(p => p.Name).Should().Contain(_newPlaceName,
            "ICalImportService must evict the Places cache after creating a new place");
    }

    private static string BuildICalFeed(string locationName)
    {
        // Use a date well in the future so the import cutoff (today) never filters it out.
        var dtStart = DateTime.UtcNow.AddMonths(3).ToString("yyyyMMddTHHmmssZ");
        var dtEnd   = DateTime.UtcNow.AddMonths(3).AddHours(2).ToString("yyyyMMddTHHmmssZ");
        var uid     = Guid.NewGuid().ToString();

        // RFC 5545 §3.1 mandates CRLF line endings; normalise explicitly so the feed is
        // valid regardless of the source file's line endings on Windows vs Linux CI.
        // The trailing "\r\n" after END:VCALENDAR is required by the spec.
        return string.Join("\r\n", new[]
        {
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//ICalCacheTest//EN",
            "BEGIN:VEVENT",
            $"UID:{uid}",
            $"DTSTART:{dtStart}",
            $"DTEND:{dtEnd}",
            "SUMMARY:Cache Test Training",
            $"LOCATION:{locationName}",
            "END:VEVENT",
            "END:VCALENDAR",
            "",
        });
    }

    private sealed class PlaceItem
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
    }
}
