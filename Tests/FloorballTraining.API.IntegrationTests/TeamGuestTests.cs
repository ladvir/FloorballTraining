using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.Plugins.EFCoreSqlServer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace FloorballTraining.API.IntegrationTests;

[Collection("Api")]
public class TeamGuestTests(CustomWebApplicationFactory factory)
{
    [Fact]
    public async Task Guest_SeesOnlyGrantedTeam_AndCannotWrite()
    {
        int teamId, otherTeamId;
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
            var club = new Club { Name = $"GuestClub-{Guid.NewGuid():N}" };
            db.Clubs.Add(club);
            await db.SaveChangesAsync();
            var season = new Season { Name = "GS", ClubId = club.Id, StartDate = DateTime.UtcNow.AddMonths(-1), EndDate = DateTime.UtcNow.AddMonths(6) };
            db.Seasons.Add(season);
            await db.SaveChangesAsync();
            var t1 = new Team { Name = "A", ClubId = club.Id, AgeGroupId = 1, SeasonId = season.Id };
            var t2 = new Team { Name = "B", ClubId = club.Id, AgeGroupId = 1 };
            db.Teams.AddRange(t1, t2);
            await db.SaveChangesAsync();
            teamId = t1.Id;
            otherTeamId = t2.Id;
            var start = DateTime.UtcNow.AddDays(2);
            db.Appointments.AddRange(
                new Appointment { AppointmentType = AppointmentType.Training, Start = start, End = start.AddHours(1), LocationId = 1, TeamId = t1.Id },
                new Appointment { AppointmentType = AppointmentType.Training, Start = start, End = start.AddHours(1), LocationId = 1, TeamId = t2.Id });
            await db.SaveChangesAsync();
        }

        // Admin creates the guest (HeadCoach+ path).
        var admin = factory.CreateClient();
        admin.DefaultRequestHeaders.Authorization = new("Bearer", await LoginHelper.GetAdminTokenAsync(admin));
        var email = $"guest-{Guid.NewGuid():N}@test.example";
        var add = await admin.PostAsJsonAsync($"/teams/{teamId}/guests",
            new { Email = email, FirstName = "Host", LastName = "Test", SendCredentials = false, Language = "cs", Password = "MojeHeslo1!" });
        add.StatusCode.Should().Be(HttpStatusCode.OK);
        var password = "MojeHeslo1!"; // chosen by the manager, so never echoed back
        (await add.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("password").ValueKind.Should().Be(JsonValueKind.Null);

        var guest = factory.CreateClient();
        guest.DefaultRequestHeaders.Authorization = new("Bearer", await LoginHelper.GetTokenAsync(guest, email, password));

        var teams = await guest.GetFromJsonAsync<JsonElement>("/teams");
        teams.EnumerateArray().Select(t => t.GetProperty("id").GetInt32()).Should().BeEquivalentTo([teamId]);
        teams.EnumerateArray().Select(t => t.GetProperty("id").GetInt32()).Should().NotContain(otherTeamId);

        // Events: the guest sees the granted team's events and no other team's.
        var events = await guest.GetFromJsonAsync<JsonElement>("/appointments?pageSize=500");
        var eventTeams = events.GetProperty("data").EnumerateArray().Select(a => a.GetProperty("teamId").GetInt32()).ToList();
        eventTeams.Should().Contain(teamId);
        eventTeams.Should().NotContain(otherTeamId);

        // Skill catalog (labels on trainings/activities) is readable for a guest.
        (await guest.GetAsync("/playerskills/catalog")).StatusCode.Should().Be(HttpStatusCode.OK);

        // Season report: the guest sees the granted team (only teams with a season are offered).
        var report = await guest.GetFromJsonAsync<JsonElement>("/seasongoals/my-teams");
        report.EnumerateArray().Select(t => t.GetProperty("teamId").GetInt32()).Should().BeEquivalentTo([teamId]);

        (await guest.PutAsJsonAsync("/auth/profile", new { FirstName = "X" })).StatusCode
            .Should().Be(HttpStatusCode.Forbidden);
        (await guest.PostAsJsonAsync("/auth/forgot-password", new { Email = email })).StatusCode
            .Should().Be(HttpStatusCode.Forbidden);
        // SignalR negotiate is a POST but must work for a guest (notifications); anything else is 403.
        (await guest.PostAsync("/hubs/notifications/negotiate?negotiateVersion=1", null)).StatusCode.Should().Be(HttpStatusCode.OK);
        (await guest.PostAsJsonAsync("/auth/logout", new { })).StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task CreateUser_AsGuest_LinksTeams_WithoutMember_AndRejectsForeignTeam()
    {
        int clubId, teamId, foreignTeamId;
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
            var club = new Club { Name = $"GuestForm-{Guid.NewGuid():N}" };
            var other = new Club { Name = $"GuestFormOther-{Guid.NewGuid():N}" };
            db.Clubs.AddRange(club, other);
            await db.SaveChangesAsync();
            var t1 = new Team { Name = "A", ClubId = club.Id, AgeGroupId = 1 };
            var t2 = new Team { Name = "B", ClubId = other.Id, AgeGroupId = 1 };
            db.Teams.AddRange(t1, t2);
            await db.SaveChangesAsync();
            clubId = club.Id; teamId = t1.Id; foreignTeamId = t2.Id;
        }
        var admin = factory.CreateClient();
        admin.DefaultRequestHeaders.Authorization = new("Bearer", await LoginHelper.GetAdminTokenAsync(admin));

        var bad = await admin.PostAsJsonAsync("/users", new
        { Email = $"g-{Guid.NewGuid():N}@test.example", Password = "Test123!", Role = "Guest", ClubId = clubId, TeamIds = new[] { foreignTeamId } });
        bad.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var email = $"g-{Guid.NewGuid():N}@test.example";
        var ok = await admin.PostAsJsonAsync("/users", new
        { Email = email, Password = "Test123!", Role = "Guest", ClubId = clubId, TeamIds = new[] { teamId } });
        ok.StatusCode.Should().Be(HttpStatusCode.OK);

        await using var scope2 = factory.Services.CreateAsyncScope();
        var db2 = scope2.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        var userId = (await ok.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString()!;
        (await db2.Members.AnyAsync(m => m.AppUserId == userId)).Should().BeFalse();
        (await db2.TeamGuests.AnyAsync(g => g.AppUserId == userId && g.TeamId == teamId)).Should().BeTrue();

        // Listed as a guest (not a player/member) and the role cannot be changed.
        var list = await admin.GetFromJsonAsync<JsonElement>("/users");
        list.EnumerateArray().Single(u => u.GetProperty("id").GetString() == userId).GetProperty("isGuest").GetBoolean().Should().BeTrue();
        (await admin.PutAsJsonAsync($"/users/{userId}/role", new { Role = "Coach" })).StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await db2.Members.AnyAsync(m => m.AppUserId == userId)).Should().BeFalse();
    }

    [Fact]
    public async Task HeadCoach_CanSetGuestLanguage()
    {
        int teamId, clubId;
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
            var club = new Club { Name = $"GuestLang-{Guid.NewGuid():N}" };
            db.Clubs.Add(club);
            await db.SaveChangesAsync();
            var team = new Team { Name = "A", ClubId = club.Id, AgeGroupId = 1 };
            db.Teams.Add(team);
            await db.SaveChangesAsync();
            clubId = club.Id; teamId = team.Id;
        }
        var admin = factory.CreateClient();
        admin.DefaultRequestHeaders.Authorization = new("Bearer", await LoginHelper.GetAdminTokenAsync(admin));
        var created = await admin.PostAsJsonAsync($"/teams/{teamId}/guests", new { Email = $"gl-{Guid.NewGuid():N}@test.example", SendCredentials = false, Language = "cs" });
        var userId = (await created.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("userId").GetString()!;

        (await admin.PutAsJsonAsync($"/users/{userId}", new { PreferredLanguage = "de" })).StatusCode.Should().Be(HttpStatusCode.NoContent);
        var list = await admin.GetFromJsonAsync<JsonElement>("/users");
        list.EnumerateArray().Single(u => u.GetProperty("id").GetString() == userId).GetProperty("preferredLanguage").GetString().Should().Be("de");
        _ = clubId;
    }
}
