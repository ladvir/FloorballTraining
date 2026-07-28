using System.Net;
using System.Net.Http.Json;
using FloorballTraining.API.Services;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.Plugins.EFCoreSqlServer;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace FloorballTraining.API.IntegrationTests;

/// <summary>
/// XP layer B (#100): coach 1-click bonuses. The award row IS the approval; XP is derived from it
/// idempotently, exactly like layer A. Covers derivation, idempotence, the anti-abuse constraints
/// (one player-of-training per event, FamilyCheered only on a match), and unaward pruning the XP.
/// </summary>
[Collection("Api")]
public class XpCoachAwardTests(CustomWebApplicationFactory factory) : IAsyncLifetime
{
    private readonly DateTime _now = new(2026, 3, 1, 12, 0, 0, DateTimeKind.Utc);
    private int _memberId;
    private int _member2Id;
    private int _trainingId;
    private int _matchId;

    public async Task InitializeAsync()
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();

        var club = new Club { Name = $"AwardClub-{Guid.NewGuid():N}" };
        db.Clubs.Add(club);
        await db.SaveChangesAsync();

        db.Seasons.Add(new Season { Name = "AwardSeason", ClubId = club.Id, StartDate = _now.AddMonths(-1), EndDate = _now.AddMonths(6) });
        var team = new Team { Name = $"AwardTeam-{Guid.NewGuid():N}", ClubId = club.Id, AgeGroupId = 1 };
        db.Teams.Add(team);
        var member = new Member { FirstName = "Award", LastName = "Player", BirthYear = 2010, ClubId = club.Id };
        var member2 = new Member { FirstName = "Award", LastName = "Two", BirthYear = 2010, ClubId = club.Id };
        db.Members.AddRange(member, member2);
        await db.SaveChangesAsync();
        _memberId = member.Id;
        _member2Id = member2.Id;

        var training = new Appointment { AppointmentType = AppointmentType.Training, Start = _now, End = _now.AddHours(1), LocationId = 1, TeamId = team.Id };
        var match = new Appointment { AppointmentType = AppointmentType.Match, Start = _now, End = _now.AddHours(1), LocationId = 1, TeamId = team.Id };
        db.Appointments.AddRange(training, match);
        await db.SaveChangesAsync();
        _trainingId = training.Id;
        _matchId = match.Id;
    }

    public Task DisposeAsync() => Task.CompletedTask;

    private async Task<int> MemberTotalAsync(int memberId)
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var xp = scope.ServiceProvider.GetRequiredService<XpService>();
        await xp.RecomputeAllAsync();
        return (await xp.GetSummaryAsync(memberId)).TotalXp;
    }

    [Fact]
    public async Task Award_DerivesXp_AndIsIdempotent()
    {
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
            db.XpCoachAwards.Add(new XpCoachAward { AppointmentId = _trainingId, MemberId = _memberId, Type = AwardType.PlayerOfTraining, AwardedByUserId = "coach" });
            db.XpCoachAwards.Add(new XpCoachAward { AppointmentId = _matchId, MemberId = _memberId, Type = AwardType.FamilyCheered, AwardedByUserId = "coach" });
            await db.SaveChangesAsync();
        }

        // PlayerOfTraining 10 + FamilyCheered 5 = 15, derived once.
        (await MemberTotalAsync(_memberId)).Should().Be(XpRules.PlayerOfTraining + XpRules.FamilyCheered);

        // Second recompute must add nothing.
        (await MemberTotalAsync(_memberId)).Should().Be(XpRules.PlayerOfTraining + XpRules.FamilyCheered);

        await using var check = factory.Services.CreateAsyncScope();
        var ctx = check.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        (await ctx.XpEvents.CountAsync(e => e.MemberId == _memberId && e.SourceKind == XpSourceKind.CoachAward))
            .Should().Be(2);
    }

    [Fact]
    public async Task OnlyOnePlayerOfTraining_PerEvent_IsRejected()
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        db.XpCoachAwards.Add(new XpCoachAward { AppointmentId = _trainingId, MemberId = _memberId, Type = AwardType.PlayerOfTraining, AwardedByUserId = "coach" });
        await db.SaveChangesAsync();

        // A second player-of-training on the same event (even for a different member) violates the filtered unique index.
        db.XpCoachAwards.Add(new XpCoachAward { AppointmentId = _trainingId, MemberId = _member2Id, Type = AwardType.PlayerOfTraining, AwardedByUserId = "coach" });
        var act = async () => await db.SaveChangesAsync();
        await act.Should().ThrowAsync<DbUpdateException>();
    }

    [Fact]
    public async Task Unaward_PrunesTheDerivedXp()
    {
        int awardId;
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
            var award = new XpCoachAward { AppointmentId = _matchId, MemberId = _memberId, Type = AwardType.FairPlay, AwardedByUserId = "coach" };
            db.XpCoachAwards.Add(award);
            await db.SaveChangesAsync();
            awardId = award.Id;
        }

        (await MemberTotalAsync(_memberId)).Should().Be(XpRules.FairPlay);

        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
            db.XpCoachAwards.Remove(await db.XpCoachAwards.FirstAsync(a => a.Id == awardId));
            await db.SaveChangesAsync();
        }

        (await MemberTotalAsync(_memberId)).Should().Be(0);
    }

    [Fact]
    public async Task Endpoint_CreatesAndLists_AndRejectsFamilyCheeredOnTraining()
    {
        var client = factory.CreateClient();
        var token = await LoginHelper.GetAdminTokenAsync(client);
        client.DefaultRequestHeaders.Authorization = new("Bearer", token);

        // FamilyCheered is match-only → rejected on a training.
        var badResp = await client.PostAsJsonAsync("/xp/awards",
            new CreateXpAwardDto { AppointmentId = _trainingId, MemberId = _memberId, Type = "FamilyCheered" });
        badResp.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        // Valid bonus is created and then listed for the event.
        var okResp = await client.PostAsJsonAsync("/xp/awards",
            new CreateXpAwardDto { AppointmentId = _trainingId, MemberId = _memberId, Type = "PlayerOfTraining" });
        okResp.StatusCode.Should().Be(HttpStatusCode.OK);

        var list = await client.GetFromJsonAsync<List<XpAwardDto>>($"/xp/awards?appointmentId={_trainingId}");
        list.Should().ContainSingle(a => a.MemberId == _memberId && a.Type == "PlayerOfTraining");
    }
}
