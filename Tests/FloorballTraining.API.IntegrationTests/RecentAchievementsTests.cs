using System.Net;
using System.Net.Http.Json;
using FloorballTraining.API.Services;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.Plugins.EFCoreSqlServer;
using FloorballTraining.Plugins.EFCoreSqlServer.Models;
using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace FloorballTraining.API.IntegrationTests;

/// <summary>
/// GET /xp/recent-achievements — the coach+ dashboard feed of badges earned and career level/rank
/// crossed in the last N days, scoped to the caller's accessible teams.
/// </summary>
[Collection("Api")]
public class RecentAchievementsTests(CustomWebApplicationFactory factory) : IAsyncLifetime
{
    private const string Pwd = "Test123!";
    private readonly string _coachEmail = $"ra-coach-{Guid.NewGuid():N}@test.example";
    private readonly string _otherCoachEmail = $"ra-other-{Guid.NewGuid():N}@test.example";
    private readonly string _headCoachEmail = $"ra-head-{Guid.NewGuid():N}@test.example";
    private int _playerId;
    private int _otherTeamPlayerId;

    public async Task InitializeAsync()
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        var um = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();

        var club = new Club { Name = $"RAClub-{Guid.NewGuid():N}" };
        var otherClub = new Club { Name = $"RAOther-{Guid.NewGuid():N}" };
        db.Clubs.AddRange(club, otherClub);
        await db.SaveChangesAsync();

        var team = new Team { Name = $"RATeam-{Guid.NewGuid():N}", ClubId = club.Id, AgeGroupId = 1 };
        var otherTeamInSameClub = new Team { Name = $"RATeam2-{Guid.NewGuid():N}", ClubId = club.Id, AgeGroupId = 1 };
        db.Teams.AddRange(team, otherTeamInSameClub);
        var player = new Member { FirstName = "Ray", LastName = "Cent", BirthYear = 2011, ClubId = club.Id };
        var otherTeamPlayer = new Member { FirstName = "Taylor", LastName = "Mate", BirthYear = 2011, ClubId = club.Id };
        db.Members.AddRange(player, otherTeamPlayer);
        await db.SaveChangesAsync();
        _playerId = player.Id;
        _otherTeamPlayerId = otherTeamPlayer.Id;
        db.TeamMembers.Add(new TeamMember { TeamId = team.Id, MemberId = player.Id, IsPlayer = true });
        db.TeamMembers.Add(new TeamMember { TeamId = otherTeamInSameClub.Id, MemberId = otherTeamPlayer.Id, IsPlayer = true });

        await CreateCoachAsync(db, um, _coachEmail, club.Id, team.Id);
        await CreateCoachAsync(db, um, _otherCoachEmail, otherClub.Id, teamId: null);
        await CreateHeadCoachAsync(db, um, _headCoachEmail, club.Id, team.Id);

        // 10 present trainings in the last two weeks → Attendance10 badge + 100 XP (Nováček → Hráč).
        // Seeded for both teams' players, so a scoping bug (e.g. HeadCoach seeing the whole club
        // instead of just the team they coach) would show up as the other team's player leaking in.
        for (var i = 0; i < 10; i++)
        {
            var when = DateTime.UtcNow.AddDays(-i - 1);
            var appt = new Appointment { AppointmentType = AppointmentType.Training, Start = when, End = when.AddHours(1), LocationId = 1, TeamId = team.Id };
            var otherAppt = new Appointment { AppointmentType = AppointmentType.Training, Start = when, End = when.AddHours(1), LocationId = 1, TeamId = otherTeamInSameClub.Id };
            db.Appointments.AddRange(appt, otherAppt);
            await db.SaveChangesAsync();
            db.AppointmentAttendances.Add(new AppointmentAttendance { AppointmentId = appt.Id, MemberId = player.Id, Status = 1, RecordedAt = when });
            db.AppointmentAttendances.Add(new AppointmentAttendance { AppointmentId = otherAppt.Id, MemberId = otherTeamPlayer.Id, Status = 1, RecordedAt = when });
        }
        await db.SaveChangesAsync();

        await scope.ServiceProvider.GetRequiredService<XpService>().RecomputeAllAsync();
        await scope.ServiceProvider.GetRequiredService<BadgeService>().RecomputeAllAsync();
    }

    private static async Task CreateCoachAsync(FloorballTrainingContext db, UserManager<AppUser> um, string email, int clubId, int? teamId)
    {
        var user = new AppUser { UserName = email, Email = email, FirstName = "C", LastName = "Oach", DefaultClubId = clubId };
        (await um.CreateAsync(user, Pwd)).Succeeded.Should().BeTrue();
        var member = new Member { FirstName = "C", LastName = "Oach", Email = email, BirthYear = 1985, ClubId = clubId, AppUserId = user.Id, HasClubRoleCoach = true };
        db.Members.Add(member);
        await db.SaveChangesAsync();
        if (teamId is int tid)
            db.TeamMembers.Add(new TeamMember { TeamId = tid, MemberId = member.Id, IsCoach = true });
        await db.SaveChangesAsync();
    }

    private static async Task CreateHeadCoachAsync(FloorballTrainingContext db, UserManager<AppUser> um, string email, int clubId, int teamId)
    {
        var user = new AppUser { UserName = email, Email = email, FirstName = "H", LastName = "Ead", DefaultClubId = clubId };
        (await um.CreateAsync(user, Pwd)).Succeeded.Should().BeTrue();
        var member = new Member { FirstName = "H", LastName = "Ead", Email = email, BirthYear = 1980, ClubId = clubId, AppUserId = user.Id, HasClubRoleMainCoach = true };
        db.Members.Add(member);
        await db.SaveChangesAsync();
        db.TeamMembers.Add(new TeamMember { TeamId = teamId, MemberId = member.Id, IsCoach = true });
        await db.SaveChangesAsync();
    }

    public Task DisposeAsync() => Task.CompletedTask;

    private async Task<HttpClient> ClientFor(string email)
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new("Bearer", await LoginHelper.GetTokenAsync(client, email, Pwd));
        return client;
    }

    [Fact]
    public async Task Coach_SeesOwnTeamPlayersBadgeAndRankUp_InTheWindow()
    {
        var client = await ClientFor(_coachEmail);
        var feed = await client.GetFromJsonAsync<List<RecentAchievementDto>>("/xp/recent-achievements?days=14");

        feed.Should().NotBeNull();
        feed!.Should().Contain(a => a.MemberId == _playerId && a.Kind == "badge" && a.BadgeCode == nameof(BadgeCode.Attendance10));
        feed.Should().Contain(a => a.MemberId == _playerId && a.Kind == "rank" && a.FromRankIndex == 0 && a.ToRankIndex == 1);
        feed.Should().OnlyContain(a => a.MemberName == "Ray Cent");
    }

    [Fact]
    public async Task HeadCoach_WithOwnTeam_SeesOnlyThatTeamsPlayers_NotWholeClub()
    {
        // The head coach explicitly coaches `team` only, not `otherTeamInSameClub` — even though
        // HeadCoach is normally club-wide, this dashboard feed should stay scoped to their own team.
        var client = await ClientFor(_headCoachEmail);
        var feed = await client.GetFromJsonAsync<List<RecentAchievementDto>>("/xp/recent-achievements?days=14");

        feed.Should().NotBeNull();
        feed!.Should().Contain(a => a.MemberId == _playerId);
        feed.Should().NotContain(a => a.MemberId == _otherTeamPlayerId);
    }

    [Fact]
    public async Task ForeignClubCoach_SeesNothing()
    {
        var client = await ClientFor(_otherCoachEmail);
        var feed = await client.GetFromJsonAsync<List<RecentAchievementDto>>("/xp/recent-achievements?days=14");
        feed.Should().NotBeNull().And.NotContain(a => a.MemberId == _playerId);
    }

    [Fact]
    public async Task Player_IsForbidden()
    {
        // The player account has no coach role anywhere.
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        var um = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
        var email = $"ra-player-{Guid.NewGuid():N}@test.example";
        var user = new AppUser { UserName = email, Email = email, FirstName = "P", LastName = "Layer" };
        (await um.CreateAsync(user, Pwd)).Succeeded.Should().BeTrue();
        var member = await db.Members.FirstAsync(m => m.Id == _playerId);
        member.AppUserId = user.Id;
        member.Email = email;
        await db.SaveChangesAsync();

        var client = await ClientFor(email);
        var res = await client.GetAsync("/xp/recent-achievements");
        res.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }
}
