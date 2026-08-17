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
/// Fan check-in + family XP (Etapa 4, #103). A guardian cheers their child at a real match: the row
/// derives the child's "family cheered" bonus (deduped with any coach mark — max 1 per match/child)
/// and grows the family's live Fan XP. Covers derivation/dedup, the time-window and guardian-scope
/// guards, and the /fan endpoints.
/// </summary>
[Collection("Api")]
public class FanCheckInTests(CustomWebApplicationFactory factory) : IAsyncLifetime
{
    private int _clubId;
    private int _teamId;
    private int _memberId;   // linked to the guardian, on the team
    private int _member2Id;  // NOT linked to the guardian
    private int _matchId;    // currently running match of the team
    private int _trainingId;
    private readonly List<string> _userIdsToDelete = new();

    public async Task InitializeAsync()
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        var now = DateTime.UtcNow;

        var club = new Club { Name = $"FanClub-{Guid.NewGuid():N}" };
        db.Clubs.Add(club);
        await db.SaveChangesAsync();
        _clubId = club.Id;

        db.Seasons.Add(new Season { Name = "FanSeason", ClubId = club.Id, StartDate = now.AddMonths(-1), EndDate = now.AddMonths(6) });
        var team = new Team { Name = $"FanTeam-{Guid.NewGuid():N}", ClubId = club.Id, AgeGroupId = 1 };
        db.Teams.Add(team);
        await db.SaveChangesAsync();
        _teamId = team.Id;

        var member = new Member { FirstName = "Fan", LastName = "Kid", BirthYear = 2012, ClubId = club.Id };
        var member2 = new Member { FirstName = "Other", LastName = "Kid", BirthYear = 2012, ClubId = club.Id };
        db.Members.AddRange(member, member2);
        await db.SaveChangesAsync();
        _memberId = member.Id;
        _member2Id = member2.Id;
        db.TeamMembers.AddRange(
            new TeamMember { TeamId = team.Id, MemberId = member.Id, IsPlayer = true },
            new TeamMember { TeamId = team.Id, MemberId = member2.Id, IsPlayer = true });

        // A match running right now (inside the check-in window) and a training (never cheerable).
        var match = new Appointment { AppointmentType = AppointmentType.Match, Start = now.AddMinutes(-10), End = now.AddMinutes(50), LocationId = 1, TeamId = team.Id };
        var training = new Appointment { AppointmentType = AppointmentType.Training, Start = now.AddMinutes(-10), End = now.AddMinutes(50), LocationId = 1, TeamId = team.Id };
        db.Appointments.AddRange(match, training);
        await db.SaveChangesAsync();
        _matchId = match.Id;
        _trainingId = training.Id;
    }

    public async Task DisposeAsync()
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        var um = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();

        // FanCheckIn.Member FK is NoAction, so clear check-ins/derived XP before removing members.
        await db.FanCheckIns.Where(f => f.MemberId == _memberId || f.MemberId == _member2Id).ExecuteDeleteAsync();
        await db.XpEvents.Where(e => e.MemberId == _memberId || e.MemberId == _member2Id).ExecuteDeleteAsync();
        await db.XpCoachAwards.Where(a => a.MemberId == _memberId || a.MemberId == _member2Id).ExecuteDeleteAsync();
        var members = await db.Members.Where(m => m.ClubId == _clubId).ToListAsync();
        db.Members.RemoveRange(members);
        await db.SaveChangesAsync();

        foreach (var id in _userIdsToDelete.Distinct())
        {
            var user = await um.FindByIdAsync(id);
            if (user != null) await um.DeleteAsync(user);
        }
    }

    private async Task<int> RecomputeAndTotalAsync(int memberId)
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var xp = scope.ServiceProvider.GetRequiredService<XpService>();
        await xp.RecomputeAllAsync();
        return (await xp.GetSummaryAsync(memberId)).TotalXp;
    }

    private async Task AddCheckInAsync(int appointmentId, int memberId, string guardianUserId)
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        db.FanCheckIns.Add(new FanCheckIn { AppointmentId = appointmentId, MemberId = memberId, GuardianAppUserId = guardianUserId });
        await db.SaveChangesAsync();
    }

    [Fact]
    public async Task CheckIn_DerivesChildBonusOnce_EvenWithMultipleGuardians()
    {
        // Two different relatives cheering the same match still give the child ONE +5 bonus.
        await AddCheckInAsync(_matchId, _memberId, "guardian-a");
        await AddCheckInAsync(_matchId, _memberId, "guardian-b");

        (await RecomputeAndTotalAsync(_memberId)).Should().Be(XpRules.FamilyCheered);

        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        (await db.XpEvents.CountAsync(e => e.MemberId == _memberId && e.Type == XpEventType.FamilyCheered))
            .Should().Be(1);
    }

    [Fact]
    public async Task CoachMark_And_FanCheckIn_GiveChildBonusOnce()
    {
        await AddCheckInAsync(_matchId, _memberId, "guardian-a");
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
            db.XpCoachAwards.Add(new XpCoachAward { AppointmentId = _matchId, MemberId = _memberId, Type = AwardType.FamilyCheered, AwardedByUserId = "coach" });
            await db.SaveChangesAsync();
        }

        // Deduped across both sources: still exactly +5, not +10.
        (await RecomputeAndTotalAsync(_memberId)).Should().Be(XpRules.FamilyCheered);

        await using var check = factory.Services.CreateAsyncScope();
        var ctx = check.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        var events = await ctx.XpEvents.Where(e => e.MemberId == _memberId && e.Type == XpEventType.FamilyCheered).ToListAsync();
        events.Should().ContainSingle();
        events[0].SourceKind.Should().Be(XpSourceKind.CoachAward); // coach mark is canonical
    }

    [Fact]
    public async Task CheckIn_Removed_PrunesChildBonus()
    {
        await AddCheckInAsync(_matchId, _memberId, "guardian-a");
        (await RecomputeAndTotalAsync(_memberId)).Should().Be(XpRules.FamilyCheered);

        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
            await db.FanCheckIns.Where(f => f.MemberId == _memberId).ExecuteDeleteAsync();
        }

        (await RecomputeAndTotalAsync(_memberId)).Should().Be(0);
    }

    // ── Endpoint tests (guardian login) ─────────────────────────────────────

    private async Task<(HttpClient client, string userId)> GuardianClientForMemberAsync(int memberId)
    {
        var admin = factory.CreateClient();
        var adminToken = await LoginHelper.GetAdminTokenAsync(admin);
        admin.DefaultRequestHeaders.Authorization = new("Bearer", adminToken);

        var email = $"fanguardian-{Guid.NewGuid():N}@test.example";
        var add = await admin.PostAsJsonAsync($"/Members/{memberId}/guardians", new { Email = email, SendCredentials = false });
        add.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await add.Content.ReadFromJsonAsync<AddGuardianResult>();
        _userIdsToDelete.Add(body!.UserId);

        var client = factory.CreateClient();
        var token = await LoginHelper.GetTokenAsync(client, email, body.Password!);
        client.DefaultRequestHeaders.Authorization = new("Bearer", token);
        return (client, body.UserId);
    }

    private sealed class AddGuardianResult
    {
        public string UserId { get; set; } = string.Empty;
        public string? Password { get; set; }
    }

    [Fact]
    public async Task CheckIn_InWindow_Succeeds_ListsCheckedIn_AndShowsFamilyXp()
    {
        var (client, _) = await GuardianClientForMemberAsync(_memberId);

        var resp = await client.PostAsJsonAsync("/fan/checkin", new FanCheckInRequest { AppointmentId = _matchId, MemberId = _memberId });
        resp.StatusCode.Should().Be(HttpStatusCode.OK);

        var children = await client.GetFromJsonAsync<List<FanChildDto>>("/fan/children");
        var child = children!.Single(c => c.MemberId == _memberId);
        child.FamilyXp.Should().Be(XpRules.FanCheckInFamilyXp);
        var match = child.Matches.Single(m => m.AppointmentId == _matchId);
        match.CheckedIn.Should().BeTrue();
        match.CanCheckIn.Should().BeFalse(); // already cheered
    }

    [Fact]
    public async Task CheckIn_Duplicate_Conflicts()
    {
        var (client, _) = await GuardianClientForMemberAsync(_memberId);
        var body = new FanCheckInRequest { AppointmentId = _matchId, MemberId = _memberId };

        (await client.PostAsJsonAsync("/fan/checkin", body)).StatusCode.Should().Be(HttpStatusCode.OK);
        (await client.PostAsJsonAsync("/fan/checkin", body)).StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task CheckIn_OnTraining_IsRejected()
    {
        var (client, _) = await GuardianClientForMemberAsync(_memberId);

        var resp = await client.PostAsJsonAsync("/fan/checkin", new FanCheckInRequest { AppointmentId = _trainingId, MemberId = _memberId });
        resp.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CheckIn_ForUnlinkedChild_IsForbidden()
    {
        // Guardian linked only to _memberId must not cheer for _member2Id.
        var (client, _) = await GuardianClientForMemberAsync(_memberId);

        var resp = await client.PostAsJsonAsync("/fan/checkin", new FanCheckInRequest { AppointmentId = _matchId, MemberId = _member2Id });
        resp.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }
}
