using FloorballTraining.API.Jobs;
using FloorballTraining.CoreBusiness;
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
/// EventRsvpReminderJob notifies a player once when a team event starts within 2 hours and they
/// still haven't RSVP'd; players who already responded (any status) are skipped, and a re-run
/// inside the window does not re-notify.
/// </summary>
[Collection("Api")]
public class EventRsvpReminderJobTests(CustomWebApplicationFactory factory) : IAsyncLifetime
{
    private const string TestPassword = "Test123!";
    private string _unrespondedUserId = string.Empty;
    private string _respondedUserId = string.Empty;
    private int _soonAppointmentId;
    private int _laterAppointmentId; // starts in 5 hours — outside the 2-hour window

    public async Task InitializeAsync()
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        var um = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();

        var club = new Club { Name = $"RsvpJobClub-{Guid.NewGuid():N}" };
        db.Clubs.Add(club);
        await db.SaveChangesAsync();

        var team = new Team { Name = $"RsvpJobTeam-{Guid.NewGuid():N}", ClubId = club.Id, AgeGroupId = 1 };
        db.Teams.Add(team);
        await db.SaveChangesAsync();

        var now = DateTime.UtcNow;
        var soon = new Appointment
        {
            AppointmentType = AppointmentType.Training, TeamId = team.Id, LocationId = 1,
            Start = now.AddHours(1), End = now.AddHours(2)
        };
        var later = new Appointment
        {
            AppointmentType = AppointmentType.Training, TeamId = team.Id, LocationId = 1,
            Start = now.AddHours(5), End = now.AddHours(6)
        };
        db.Appointments.AddRange(soon, later);
        await db.SaveChangesAsync();
        _soonAppointmentId = soon.Id;
        _laterAppointmentId = later.Id;

        async Task<(string userId, int memberId)> AddPlayer(string tag)
        {
            var email = $"rsvpjob-{tag}-{Guid.NewGuid():N}@test.example";
            var user = new AppUser { UserName = email, Email = email, FirstName = tag, LastName = "P", DefaultClubId = club.Id };
            (await um.CreateAsync(user, TestPassword)).Succeeded.Should().BeTrue();
            var member = new Member { FirstName = tag, LastName = "P", BirthYear = 2010, ClubId = club.Id, AppUserId = user.Id };
            db.Members.Add(member);
            await db.SaveChangesAsync();
            db.TeamMembers.Add(new TeamMember { TeamId = team.Id, MemberId = member.Id, IsPlayer = true });
            await db.SaveChangesAsync();
            return (user.Id, member.Id);
        }

        var (unrespUserId, _) = await AddPlayer("noresp");
        var (respUserId, respMemberId) = await AddPlayer("resp");
        _unrespondedUserId = unrespUserId;
        _respondedUserId = respUserId;

        // The "responded" player already said "Nejdu" (status 2) for the soon event.
        db.EventRsvps.Add(new EventRsvp { AppointmentId = soon.Id, MemberId = respMemberId, Status = 2 });
        await db.SaveChangesAsync();
    }

    public Task DisposeAsync() => Task.CompletedTask;

    private async Task RunJobAsync()
    {
        await using var scope = factory.Services.CreateAsyncScope();
        await scope.ServiceProvider.GetRequiredService<EventRsvpReminderJob>().ExecuteAsync();
    }

    private async Task<int> ReminderCountAsync(string userId)
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        return await db.Notifications.CountAsync(n =>
            n.UserId == userId && n.Type == $"event_rsvp_reminder:{_soonAppointmentId}");
    }

    [Fact]
    public async Task Reminds_UnrespondedPlayer_Once_AndSkips_RespondedPlayer()
    {
        await RunJobAsync();
        await RunJobAsync(); // second pass inside the window must not re-notify

        (await ReminderCountAsync(_unrespondedUserId)).Should().Be(1);
        (await ReminderCountAsync(_respondedUserId)).Should().Be(0);
    }

    [Fact]
    public async Task DoesNotRemind_ForEvents_OutsideThe2HourWindow()
    {
        await RunJobAsync();

        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        (await db.Notifications.CountAsync(n =>
            n.UserId == _unrespondedUserId && n.Type == $"event_rsvp_reminder:{_laterAppointmentId}"))
            .Should().Be(0);
    }
}
