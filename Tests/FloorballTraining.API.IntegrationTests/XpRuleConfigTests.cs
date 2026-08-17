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
/// Configurable XP values (#106): club/team point overrides feed the derivation with fallback
/// team → club → <see cref="XpRules"/>, and changing a value re-prices already-persisted events.
/// Each test seeds its own club so overrides stay isolated in the shared DB.
/// </summary>
[Collection("Api")]
public class XpRuleConfigTests(CustomWebApplicationFactory factory) : IAsyncLifetime
{
    private readonly DateTime _now = new(2026, 4, 1, 12, 0, 0, DateTimeKind.Utc);
    private int _clubId;
    private int _teamId;
    private int _memberId;

    public async Task InitializeAsync()
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();

        var club = new Club { Name = $"XpCfgClub-{Guid.NewGuid():N}" };
        db.Clubs.Add(club);
        await db.SaveChangesAsync();
        _clubId = club.Id;

        var team = new Team { Name = $"XpCfgTeam-{Guid.NewGuid():N}", ClubId = _clubId, AgeGroupId = 1 };
        var member = new Member { FirstName = "Cfg", LastName = "Player", BirthYear = 2010, ClubId = _clubId };
        db.Teams.Add(team);
        db.Members.Add(member);
        await db.SaveChangesAsync();
        _teamId = team.Id;
        _memberId = member.Id;

        db.TeamMembers.Add(new TeamMember { TeamId = _teamId, MemberId = _memberId, IsPlayer = true });

        // Team-scoped source: one training attendance (event carries the team via its appointment).
        var training = new Appointment { AppointmentType = AppointmentType.Training, Start = _now, End = _now.AddHours(1), LocationId = 1, TeamId = _teamId };
        db.Appointments.Add(training);
        await db.SaveChangesAsync();
        db.AppointmentAttendances.Add(new AppointmentAttendance { AppointmentId = training.Id, MemberId = _memberId, Status = 1, RecordedAt = _now });

        // Team-less source: a skill grade improvement 4 -> 3 (priced at club scope only).
        var category = new SkillCategory { Name = $"XpCfgCat-{Guid.NewGuid():N}", Position = SkillCategoryPosition.FieldPlayer, SortOrder = 1 };
        db.SkillCategories.Add(category);
        await db.SaveChangesAsync();
        var skill = new Skill { SkillCategoryId = category.Id, Name = "XpCfgSkill", SortOrder = 1 };
        db.Skills.Add(skill);
        await db.SaveChangesAsync();
        db.PlayerSkillRatings.AddRange(
            new PlayerSkillRating { MemberId = _memberId, SkillId = skill.Id, Grade = 4, RatedAt = _now.AddDays(-2) },
            new PlayerSkillRating { MemberId = _memberId, SkillId = skill.Id, Grade = 3, RatedAt = _now });
        await db.SaveChangesAsync();
    }

    public Task DisposeAsync() => Task.CompletedTask;

    private async Task RecomputeAsync()
    {
        await using var scope = factory.Services.CreateAsyncScope();
        await scope.ServiceProvider.GetRequiredService<XpService>().RecomputeAllAsync();
    }

    private async Task AddOverrideAsync(int? teamId, XpEventType type, int points)
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        db.XpRuleConfigs.Add(new XpRuleConfig { ClubId = _clubId, TeamId = teamId, EventType = type, Points = points });
        await db.SaveChangesAsync();
    }

    private async Task<XpEvent> MyEventAsync(XpEventType type)
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        return await db.XpEvents.AsNoTracking().SingleAsync(e => e.MemberId == _memberId && e.Type == type);
    }

    [Fact]
    public async Task ClubOverride_IsApplied_UntouchedTypeFallsBackToDefault()
    {
        await AddOverrideAsync(null, XpEventType.TrainingAttendance, 30);
        await RecomputeAsync();

        (await MyEventAsync(XpEventType.TrainingAttendance)).Points.Should().Be(30);      // club override
        (await MyEventAsync(XpEventType.SkillGradeImprovement)).Points
            .Should().Be(XpRules.SkillGradeImprovement);                                   // default fallback (25)
    }

    [Fact]
    public async Task TeamOverride_WinsOverClub_ForTeamScopedEvent()
    {
        await AddOverrideAsync(null, XpEventType.TrainingAttendance, 30);
        await AddOverrideAsync(_teamId, XpEventType.TrainingAttendance, 45);
        await RecomputeAsync();

        (await MyEventAsync(XpEventType.TrainingAttendance)).Points.Should().Be(45);
    }

    [Fact]
    public async Task ChangingValue_RePricesExistingEvent_WithoutDuplicating()
    {
        await RecomputeAsync(); // priced at the default 10
        var original = await MyEventAsync(XpEventType.TrainingAttendance);
        original.Points.Should().Be(XpRules.TrainingAttendance);

        await AddOverrideAsync(null, XpEventType.TrainingAttendance, 30);
        await RecomputeAsync();

        var repriced = await MyEventAsync(XpEventType.TrainingAttendance); // still a single row (SingleAsync)
        repriced.Id.Should().Be(original.Id); // updated in place, not re-inserted
        repriced.Points.Should().Be(30);
    }

    [Fact]
    public async Task RulesCatalog_ReturnsEffectiveClubValues_WithLayerAndTriggerMetadata()
    {
        // #107: the "How to earn XP" catalog serves club-effective values + layer/trigger/self metadata.
        await AddOverrideAsync(null, XpEventType.Goal, 42);

        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new("Bearer", await LoginHelper.GetAdminTokenAsync(client));
        var catalog = (await client.GetFromJsonAsync<List<XpRuleCatalogItemDto>>($"/xp/rules?clubId={_clubId}"))!;

        catalog.Should().HaveCount(XpRules.ConfigurableTypes.Count);

        var goal = catalog.Single(c => c.Code == nameof(XpEventType.Goal));
        goal.Points.Should().Be(42);            // club override applied
        goal.Layer.Should().Be("A");
        goal.Trigger.Should().Be("player");
        goal.SelfActionable.Should().BeTrue();

        var assist = catalog.Single(c => c.Code == nameof(XpEventType.Assist));
        assist.Points.Should().Be(XpRules.Assist); // no override → default

        var best = catalog.Single(c => c.Code == nameof(XpEventType.PlayerOfTraining));
        best.Layer.Should().Be("B");
        best.Trigger.Should().Be("coach");
        best.SelfActionable.Should().BeFalse();

        var family = catalog.Single(c => c.Code == nameof(XpEventType.FamilyCheered));
        family.Trigger.Should().Be("parent");

        catalog.Single(c => c.Code == nameof(XpEventType.HomeTraining)).Layer.Should().Be("C");
    }

    [Fact]
    public async Task TeamOverride_OnTeamlessType_IsIgnored()
    {
        // A team row for a member-level event type must not affect its club-scoped pricing.
        await AddOverrideAsync(_teamId, XpEventType.SkillGradeImprovement, 99);
        await RecomputeAsync();

        (await MyEventAsync(XpEventType.SkillGradeImprovement)).Points
            .Should().Be(XpRules.SkillGradeImprovement); // default, team override ignored
    }
}
