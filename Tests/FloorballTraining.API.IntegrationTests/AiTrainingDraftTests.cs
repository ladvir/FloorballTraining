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
using System.Text.Json;

namespace FloorballTraining.API.IntegrationTests;

/// <summary>
/// End-to-end AI training generation (POST /ai/training-draft): SSE stream shape,
/// activity-id grounding (hallucinations dropped with warnings), usage-log rows for
/// success and failure, and the pre-stream error codes (AI disabled, no credential).
/// </summary>
[Collection("Api")]
public class AiTrainingDraftTests : IAsyncLifetime
{
    private readonly CustomWebApplicationFactory _factory;
    private const string TestPassword = "Test123!";
    private const string AnthropicUrl = "https://api.anthropic.com/v1/messages";

    private readonly string _coachEmail = $"gen-coach-{Guid.NewGuid():N}@test.example";
    private int _clubId;
    private int _goalTagId;
    private int _activityId;
    private string _coachUserId = "";

    public AiTrainingDraftTests(CustomWebApplicationFactory factory) => _factory = factory;

    public async Task InitializeAsync()
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        var um = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();

        var club = new Club { Name = $"GenClub-{Guid.NewGuid():N}" };
        db.Clubs.Add(club);
        var goalTag = new Tag { Name = $"GenGoal-{Guid.NewGuid():N}", IsTrainingGoal = true };
        db.Tags.Add(goalTag);
        await db.SaveChangesAsync();
        _clubId = club.Id;
        _goalTagId = goalTag.Id;

        var activity = new Activity
        {
            Name = "Střelba po přihrávce",
            Description = "Zakončení po kombinaci",
            IsDraft = false,
            DurationMin = 10,
            DurationMax = 30,
            PersonsMin = 4,
            PersonsMax = 20,
        };
        activity.ActivityTags.Add(new ActivityTag { TagId = goalTag.Id });
        db.Activities.Add(activity);
        await db.SaveChangesAsync();
        _activityId = activity.Id;

        var coach = new AppUser
        {
            UserName = _coachEmail, Email = _coachEmail,
            FirstName = "Gen", LastName = "Coach", DefaultClubId = _clubId
        };
        (await um.CreateAsync(coach, TestPassword)).Succeeded.Should().BeTrue();
        _coachUserId = coach.Id;
        db.Members.Add(new Member
        {
            FirstName = "Gen", LastName = "Coach", Email = _coachEmail, BirthYear = 1990,
            ClubId = _clubId, AppUserId = coach.Id, HasClubRoleCoach = true
        });
        await db.SaveChangesAsync();
    }

    public Task DisposeAsync() => Task.CompletedTask;

    private async Task<HttpClient> CoachClient()
    {
        var client = _factory.CreateClient();
        var token = await LoginHelper.GetTokenAsync(client, _coachEmail, TestPassword);
        client.DefaultRequestHeaders.Authorization = new("Bearer", token);
        return client;
    }

    private async Task EnableAiWithCoachCredentialAsync()
    {
        var coach = await CoachClient();
        var existing = await coach.GetFromJsonAsync<List<AiCredentialDto>>("/aicredentials");
        if (existing!.Count == 0)
        {
            (await coach.PostAsJsonAsync("/aicredentials", new CreateAiCredentialRequest
            {
                Name = "Gen key", Provider = AiProvider.Anthropic, ApiKey = "sk-gen-test"
            })).EnsureSuccessStatusCode();
        }

        var adminClient = _factory.CreateClient();
        var adminToken = await LoginHelper.GetAdminTokenAsync(adminClient);
        adminClient.DefaultRequestHeaders.Authorization = new("Bearer", adminToken);
        (await adminClient.PutAsJsonAsync("/aisettings/global",
            new UpdateAiSettingsRequest { Enabled = true })).EnsureSuccessStatusCode();
        (await adminClient.PutAsJsonAsync($"/aisettings/club/{_clubId}",
            new UpdateAiSettingsRequest { Enabled = true })).EnsureSuccessStatusCode();
    }

    private TrainingGenerationRequest Request() => new()
    {
        ClubId = _clubId,
        GoalTagIds = [_goalTagId],
        AgeGroupId = 1, // seeded "Kdokoliv"
        DurationMinutes = 60,
        PersonsMin = 5,
        PersonsMax = 12,
    };

    /// <summary>Anthropic-shaped SSE body whose text deltas assemble the given JSON.</summary>
    private static string CannedSse(string draftJson)
    {
        var escaped = JsonSerializer.Serialize(draftJson); // JSON string literal incl. quotes
        return
            "event: message_start\n" +
            "data: {\"type\":\"message_start\",\"message\":{\"usage\":{\"input_tokens\":42}}}\n\n" +
            "event: content_block_delta\n" +
            $"data: {{\"type\":\"content_block_delta\",\"delta\":{{\"type\":\"text_delta\",\"text\":{escaped}}}}}\n\n" +
            "event: message_delta\n" +
            "data: {\"type\":\"message_delta\",\"usage\":{\"output_tokens\":7}}\n\n" +
            "event: message_stop\n" +
            "data: {\"type\":\"message_stop\"}\n\n";
    }

    private static Dictionary<string, string> ParseSseEvents(string body)
    {
        var result = new Dictionary<string, string>();
        string? currentEvent = null;
        foreach (var line in body.Split('\n'))
        {
            if (line.StartsWith("event: ")) currentEvent = line["event: ".Length..].Trim();
            else if (line.StartsWith("data: ") && currentEvent != null)
                result[currentEvent] = line["data: ".Length..]; // last event of each type wins
        }
        return result;
    }

    [Fact]
    public async Task Generate_GroundsDraft_DropsHallucinatedIds_AndLogsUsage()
    {
        await EnableAiWithCoachCredentialAsync();

        var hallucinatedId = _activityId + 987654;
        var draftJson =
            $"{{\"name\":\"AI trénink střelby\",\"description\":\"Draft\",\"parts\":[{{\"name\":\"Hlavní část\"," +
            $"\"duration\":60,\"activities\":[{{\"activityId\":{_activityId}}},{{\"activityId\":{hallucinatedId}}}]}}]}}";
        _factory.HttpStubs[AnthropicUrl] = CannedSse(draftJson);

        var coach = await CoachClient();
        var response = await coach.PostAsJsonAsync("/ai/training-draft", Request());

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Content.Headers.ContentType!.MediaType.Should().Be("text/event-stream");

        var events = ParseSseEvents(await response.Content.ReadAsStringAsync());
        events.Should().ContainKey("result").And.NotContainKey("error");

        var result = JsonSerializer.Deserialize<TrainingDraftResultDto>(events["result"],
            new JsonSerializerOptions(JsonSerializerDefaults.Web))!;
        result.Draft.Parts.Single().Activities.Should()
            .ContainSingle(a => a.ActivityId == _activityId && a.ActivityName == "Střelba po přihrávce");
        result.Warnings.Should().ContainSingle(w =>
            w.Code == "unknownActivity" && w.Value == hallucinatedId.ToString());
        result.Usage.InputTokens.Should().Be(42);
        result.Usage.OutputTokens.Should().Be(7);
        result.Draft.AgeGroupId.Should().Be(1);
        result.Draft.GoalTagIds.Should().Equal(_goalTagId);

        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        var log = await db.AiUsageLogs
            .Where(l => l.UserId == _coachUserId && l.Feature == AiFeature.TrainingGeneration && l.Success)
            .OrderByDescending(l => l.Id)
            .FirstOrDefaultAsync();
        log.Should().NotBeNull();
        log!.ClubId.Should().Be(_clubId);
        log.Provider.Should().Be(AiProvider.Anthropic);
        log.CredentialSource.Should().Be(AiCredentialSource.Own);
        log.InputTokens.Should().Be(42);
        log.OutputTokens.Should().Be(7);
    }

    [Fact]
    public async Task Generate_UnparsableModelOutput_EmitsErrorEvent_AndLogsFailure()
    {
        await EnableAiWithCoachCredentialAsync();
        _factory.HttpStubs[AnthropicUrl] = CannedSse("Bohužel žádný JSON.");

        var coach = await CoachClient();
        var response = await coach.PostAsJsonAsync("/ai/training-draft", Request());

        var events = ParseSseEvents(await response.Content.ReadAsStringAsync());
        events.Should().ContainKey("error").And.NotContainKey("result");
        events["error"].Should().Contain("noJson");

        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        var log = await db.AiUsageLogs
            .Where(l => l.UserId == _coachUserId && !l.Success)
            .OrderByDescending(l => l.Id)
            .FirstOrDefaultAsync();
        log.Should().NotBeNull();
        log!.ErrorType.Should().Be("noJson");
    }

    [Fact]
    public async Task Generate_AiDisabled_Returns403WithCode()
    {
        await EnableAiWithCoachCredentialAsync();

        var adminClient = _factory.CreateClient();
        var adminToken = await LoginHelper.GetAdminTokenAsync(adminClient);
        adminClient.DefaultRequestHeaders.Authorization = new("Bearer", adminToken);
        (await adminClient.PutAsJsonAsync($"/aisettings/club/{_clubId}",
            new UpdateAiSettingsRequest { Enabled = false })).EnsureSuccessStatusCode();

        var coach = await CoachClient();
        var response = await coach.PostAsJsonAsync("/ai/training-draft", Request());

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await response.Content.ReadAsStringAsync()).Should().Contain("aiDisabled");
    }

    [Fact]
    public async Task Generate_NoCredentialAnywhere_Returns400WithCode()
    {
        await EnableAiWithCoachCredentialAsync();

        // Remove the coach's own credentials; no club/global default is configured.
        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
            var mine = await db.UserAiCredentials.Where(c => c.UserId == _coachUserId).ToListAsync();
            db.UserAiCredentials.RemoveRange(mine);
            await db.SaveChangesAsync();
        }

        var coach = await CoachClient();
        var response = await coach.PostAsJsonAsync("/ai/training-draft", Request());

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await response.Content.ReadAsStringAsync()).Should().Contain("noCredential");
    }

    [Fact]
    public async Task Generate_ForeignClub_IsForbidden()
    {
        await EnableAiWithCoachCredentialAsync();

        int foreignClubId;
        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
            var foreign = new Club { Name = $"GenForeign-{Guid.NewGuid():N}" };
            db.Clubs.Add(foreign);
            await db.SaveChangesAsync();
            foreignClubId = foreign.Id;
        }

        var coach = await CoachClient();
        var request = Request();
        request.ClubId = foreignClubId;
        var response = await coach.PostAsJsonAsync("/ai/training-draft", request);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }
}
