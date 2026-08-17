using System.Net;
using System.Net.Http.Json;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.Plugins.EFCoreSqlServer;
using FloorballTraining.Plugins.EFCoreSqlServer.Models;
using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace FloorballTraining.API.IntegrationTests;

/// <summary>
/// Player self-rating of a past event (FlotrPlayer) may only be created/edited/deleted within
/// RatingsController.RatingWindowDays (3 days) after the event's End.
/// </summary>
[Collection("Api")]
public class RatingsWindowTests : IAsyncLifetime
{
    private readonly CustomWebApplicationFactory _factory;
    private const string TestPassword = "Test123!";
    private readonly string _playerEmail = $"rw-player-{Guid.NewGuid():N}@test.example";

    private string _playerUserId = string.Empty;
    private int _recentAppointmentId; // ended 1 day ago - inside the 3-day window
    private int _oldAppointmentId; // ended 5 days ago - outside the window

    public RatingsWindowTests(CustomWebApplicationFactory factory) => _factory = factory;

    public async Task InitializeAsync()
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        var um = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();

        var club = new Club { Name = $"RwClub-{Guid.NewGuid():N}" };
        db.Clubs.Add(club);
        await db.SaveChangesAsync();

        var team = new Team { Name = $"RwTeam-{Guid.NewGuid():N}", ClubId = club.Id, AgeGroupId = 1 };
        db.Teams.Add(team);
        await db.SaveChangesAsync();

        var now = DateTime.UtcNow;
        var recent = new Appointment
        {
            AppointmentType = AppointmentType.Training, TeamId = team.Id, LocationId = 1,
            Start = now.AddDays(-1).AddHours(-1), End = now.AddDays(-1)
        };
        var old = new Appointment
        {
            AppointmentType = AppointmentType.Training, TeamId = team.Id, LocationId = 1,
            Start = now.AddDays(-5).AddHours(-1), End = now.AddDays(-5)
        };
        db.Appointments.AddRange(recent, old);
        await db.SaveChangesAsync();
        _recentAppointmentId = recent.Id;
        _oldAppointmentId = old.Id;

        var player = new AppUser { UserName = _playerEmail, Email = _playerEmail, FirstName = "Rw", LastName = "Player", DefaultClubId = club.Id };
        (await um.CreateAsync(player, TestPassword)).Succeeded.Should().BeTrue();
        _playerUserId = player.Id;
        var member = new Member { FirstName = "Rw", LastName = "Player", BirthYear = 2010, ClubId = club.Id, AppUserId = player.Id };
        db.Members.Add(member);
        await db.SaveChangesAsync();
        db.TeamMembers.Add(new TeamMember { TeamId = team.Id, MemberId = member.Id, IsPlayer = true });
        await db.SaveChangesAsync();
    }

    public Task DisposeAsync() => Task.CompletedTask;

    private async Task<HttpClient> PlayerClientAsync()
    {
        var client = _factory.CreateClient();
        var token = await LoginHelper.GetTokenAsync(client, _playerEmail, TestPassword);
        client.DefaultRequestHeaders.Authorization = new("Bearer", token);
        return client;
    }

    /// <summary>Seeds a rating directly in the DB (bypassing Create's own window check) so
    /// Update/Delete's window check can be exercised against an already-expired event.</summary>
    private async Task<int> SeedRatingAsync(int appointmentId, int grade)
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        var rating = new AppointmentRating
        {
            AppointmentId = appointmentId, UserId = _playerUserId, Grade = grade, RaterType = RaterType.Player
        };
        db.AppointmentRatings.Add(rating);
        await db.SaveChangesAsync();
        return rating.Id;
    }

    [Fact]
    public async Task Create_WithinWindow_Succeeds()
    {
        var player = await PlayerClientAsync();
        var resp = await player.PostAsJsonAsync("/ratings",
            new AppointmentRatingDto { AppointmentId = _recentAppointmentId, Grade = 2, Comment = "Dobrý trénink" });
        resp.EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task Create_OlderThanWindow_IsRejected()
    {
        var player = await PlayerClientAsync();
        var resp = await player.PostAsJsonAsync("/ratings",
            new AppointmentRatingDto { AppointmentId = _oldAppointmentId, Grade = 2 });
        resp.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Update_WithinWindow_Succeeds_ButOutsideWindow_IsRejected()
    {
        var recentRatingId = await SeedRatingAsync(_recentAppointmentId, 3);
        var oldRatingId = await SeedRatingAsync(_oldAppointmentId, 3);
        var player = await PlayerClientAsync();

        (await player.PutAsJsonAsync($"/ratings/{recentRatingId}",
                new AppointmentRatingDto { AppointmentId = _recentAppointmentId, Grade = 1 }))
            .EnsureSuccessStatusCode();

        (await player.PutAsJsonAsync($"/ratings/{oldRatingId}",
                new AppointmentRatingDto { AppointmentId = _oldAppointmentId, Grade = 1 }))
            .StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Delete_WithinWindow_Succeeds_ButOutsideWindow_IsRejected()
    {
        var recentRatingId = await SeedRatingAsync(_recentAppointmentId, 3);
        var oldRatingId = await SeedRatingAsync(_oldAppointmentId, 3);
        var player = await PlayerClientAsync();

        (await player.DeleteAsync($"/ratings/{oldRatingId}"))
            .StatusCode.Should().Be(HttpStatusCode.BadRequest);

        (await player.DeleteAsync($"/ratings/{recentRatingId}"))
            .StatusCode.Should().Be(HttpStatusCode.NoContent);
    }
}
