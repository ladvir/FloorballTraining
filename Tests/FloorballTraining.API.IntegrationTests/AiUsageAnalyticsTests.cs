using FloorballTraining.API.Jobs;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.Plugins.EFCoreSqlServer;
using FloorballTraining.Plugins.EFCoreSqlServer.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Net;
using System.Net.Http.Json;

namespace FloorballTraining.API.IntegrationTests;

/// <summary>
/// AI usage analytics (/aiusage): aggregation math on seeded metering rows,
/// hard club scoping (HeadCoach sees only their club, foreign clubId is 403,
/// plain coach has no access), log paging and the retention job.
/// </summary>
[Collection("Api")]
public class AiUsageAnalyticsTests : IAsyncLifetime
{
    private readonly CustomWebApplicationFactory _factory;
    private const string TestPassword = "Test123!";

    private readonly string _headCoachEmail = $"usage-hc-{Guid.NewGuid():N}@test.example";
    private readonly string _plainCoachEmail = $"usage-coach-{Guid.NewGuid():N}@test.example";

    private int _clubId;
    private int _otherClubId;
    private int _teamId;
    private string _headCoachUserId = "";

    public AiUsageAnalyticsTests(CustomWebApplicationFactory factory) => _factory = factory;

    public async Task InitializeAsync()
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        var um = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();

        var club = new Club { Name = $"UsageClub-{Guid.NewGuid():N}" };
        var otherClub = new Club { Name = $"UsageOther-{Guid.NewGuid():N}" };
        db.Clubs.AddRange(club, otherClub);
        await db.SaveChangesAsync();
        _clubId = club.Id;
        _otherClubId = otherClub.Id;

        var team = new Team { Name = $"UsageTeam-{Guid.NewGuid():N}", ClubId = _clubId, AgeGroupId = 1 };
        db.Teams.Add(team);
        await db.SaveChangesAsync();
        _teamId = team.Id;

        var headCoach = new AppUser
        {
            UserName = _headCoachEmail, Email = _headCoachEmail,
            FirstName = "Usage", LastName = "HeadCoach", DefaultClubId = _clubId
        };
        (await um.CreateAsync(headCoach, TestPassword)).Succeeded.Should().BeTrue();
        _headCoachUserId = headCoach.Id;
        db.Members.Add(new Member
        {
            FirstName = "Usage", LastName = "HeadCoach", Email = _headCoachEmail, BirthYear = 1985,
            ClubId = _clubId, AppUserId = headCoach.Id, HasClubRoleMainCoach = true
        });

        var plainCoach = new AppUser
        {
            UserName = _plainCoachEmail, Email = _plainCoachEmail,
            FirstName = "Usage", LastName = "Coach", DefaultClubId = _clubId
        };
        (await um.CreateAsync(plainCoach, TestPassword)).Succeeded.Should().BeTrue();
        db.Members.Add(new Member
        {
            FirstName = "Usage", LastName = "Coach", Email = _plainCoachEmail, BirthYear = 1990,
            ClubId = _clubId, AppUserId = plainCoach.Id, HasClubRoleCoach = true
        });
        await db.SaveChangesAsync();

        var now = DateTime.UtcNow;
        db.AiUsageLogs.AddRange(
            // Own club: 2 successful training generations + 1 failed report call with a team.
            new AiUsageLog
            {
                UserId = _headCoachUserId, ClubId = _clubId, Feature = AiFeature.TrainingGeneration,
                Provider = AiProvider.Anthropic, Model = "claude-opus-4-8",
                CredentialSource = AiCredentialSource.Own,
                InputTokens = 100, OutputTokens = 50, DurationMs = 2000, Success = true,
                CreatedAt = now.AddDays(-1)
            },
            new AiUsageLog
            {
                UserId = _headCoachUserId, ClubId = _clubId, Feature = AiFeature.TrainingGeneration,
                Provider = AiProvider.Gemini, Model = "gemini-2.0-flash",
                CredentialSource = AiCredentialSource.ClubDefault,
                InputTokens = 200, OutputTokens = 100, DurationMs = 4000, Success = true,
                CreatedAt = now.AddDays(-2)
            },
            new AiUsageLog
            {
                UserId = _headCoachUserId, ClubId = _clubId, TeamId = _teamId,
                Feature = AiFeature.PlayerReport,
                Provider = AiProvider.Anthropic, Model = "claude-opus-4-8",
                CredentialSource = AiCredentialSource.Own,
                InputTokens = 30, OutputTokens = 0, DurationMs = 1000, Success = false,
                ErrorType = "QuotaExceeded", CreatedAt = now.AddDays(-1)
            },
            // Foreign club row — must never appear in the head coach's view.
            new AiUsageLog
            {
                UserId = "foreign-user", ClubId = _otherClubId, Feature = AiFeature.TrainingGeneration,
                Provider = AiProvider.OpenAi, Model = "gpt-4o",
                CredentialSource = AiCredentialSource.GlobalDefault,
                InputTokens = 999, OutputTokens = 999, DurationMs = 1, Success = true,
                CreatedAt = now.AddDays(-1)
            },
            // Ancient row for the retention job test.
            new AiUsageLog
            {
                UserId = _headCoachUserId, ClubId = _clubId, Feature = AiFeature.TrainingGeneration,
                Provider = AiProvider.Anthropic, Model = "old",
                CredentialSource = AiCredentialSource.Own,
                InputTokens = 1, OutputTokens = 1, DurationMs = 1, Success = true,
                CreatedAt = now.AddDays(-400)
            });
        await db.SaveChangesAsync();

        // AiUsageLog is IAuditable, so the AuditableInterceptor stamped CreatedAt with
        // "now" on insert. Backdate the ancient row via ExecuteUpdate (bypasses the
        // interceptor) so the window filter and the retention job see a truly old row.
        await db.AiUsageLogs
            .Where(l => l.Model == "old")
            .ExecuteUpdateAsync(s => s.SetProperty(l => l.CreatedAt, now.AddDays(-400)));
    }

    public Task DisposeAsync() => Task.CompletedTask;

    private async Task<HttpClient> ClientFor(string email)
    {
        var client = _factory.CreateClient();
        var token = await LoginHelper.GetTokenAsync(client, email, TestPassword);
        client.DefaultRequestHeaders.Authorization = new("Bearer", token);
        return client;
    }

    [Fact]
    public async Task Summary_HeadCoach_IsScopedToOwnClub_WithAggregates()
    {
        var headCoach = await ClientFor(_headCoachEmail);
        var from = DateTime.UtcNow.AddDays(-7).ToString("yyyy-MM-dd");
        var summary = await headCoach.GetFromJsonAsync<AiUsageSummaryDto>(
            $"/aiusage/summary?from={from}");

        // 3 recent rows of the own club; the foreign-club and ancient rows are excluded.
        summary!.Totals.Calls.Should().Be(3);
        summary.Totals.InputTokens.Should().Be(330);
        summary.Totals.OutputTokens.Should().Be(150);
        summary.Totals.ErrorRatePct.Should().Be(33.3);

        summary.ByFeature.Should().HaveCount(2);
        summary.ByFeature.Single(f => f.Feature == AiFeature.TrainingGeneration).Calls.Should().Be(2);
        summary.ByProvider.Single(p => p.Provider == AiProvider.Gemini).InputTokens.Should().Be(200);
        summary.ByUser.Should().ContainSingle().Which.Calls.Should().Be(3);
        summary.ByTeam.Should().ContainSingle().Which.TeamId.Should().Be(_teamId);
    }

    [Fact]
    public async Task Summary_ForeignClub_403_PlainCoach_403_AdminSeesAll()
    {
        var headCoach = await ClientFor(_headCoachEmail);
        (await headCoach.GetAsync($"/aiusage/summary?clubId={_otherClubId}"))
            .StatusCode.Should().Be(HttpStatusCode.Forbidden);

        var plainCoach = await ClientFor(_plainCoachEmail);
        (await plainCoach.GetAsync("/aiusage/summary"))
            .StatusCode.Should().Be(HttpStatusCode.Forbidden);

        var admin = _factory.CreateClient();
        var adminToken = await LoginHelper.GetAdminTokenAsync(admin);
        admin.DefaultRequestHeaders.Authorization = new("Bearer", adminToken);
        var from = DateTime.UtcNow.AddDays(-7).ToString("yyyy-MM-dd");
        var foreign = await admin.GetFromJsonAsync<AiUsageSummaryDto>(
            $"/aiusage/summary?from={from}&clubId={_otherClubId}");
        foreign!.Totals.Calls.Should().Be(1);
        foreign.Totals.InputTokens.Should().Be(999);
    }

    [Fact]
    public async Task Logs_ArePagedAndScoped()
    {
        var headCoach = await ClientFor(_headCoachEmail);
        var from = DateTime.UtcNow.AddDays(-7).ToString("yyyy-MM-dd");
        var response = await headCoach.GetAsync($"/aiusage/logs?from={from}&page=1&pageSize=2");
        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadFromJsonAsync<AiUsageLogsPage>();
        body!.Total.Should().Be(3);
        body.Items.Should().HaveCount(2);
        body.Items.Should().OnlyContain(l => l.ClubId == _clubId);
        body.Items.Should().OnlyContain(l => l.UserName.Contains("Usage"));
    }

    private sealed class AiUsageLogsPage
    {
        public List<AiUsageLogDto> Items { get; set; } = [];
        public int Total { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
    }

    [Fact]
    public async Task RetentionJob_DeletesOnlyRowsPastTheWindow()
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var job = scope.ServiceProvider.GetRequiredService<AiUsageRetentionJob>();
        await job.ExecuteAsync();

        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        (await db.AiUsageLogs.AnyAsync(l => l.Model == "old")).Should().BeFalse("older than 365 days");
        (await db.AiUsageLogs.AnyAsync(l => l.UserId == _headCoachUserId)).Should().BeTrue("recent rows survive");
    }
}
