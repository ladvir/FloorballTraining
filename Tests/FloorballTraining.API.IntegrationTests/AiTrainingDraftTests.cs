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

    private static string CannedCompletion(string text) => System.Text.Json.JsonSerializer.Serialize(new
    {
        content = new object[] { new { type = "text", text } },
        usage = new { input_tokens = 30, output_tokens = 12 }
    });

    private async Task<int> SeedActivityAsync(string name)
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        var activity = new Activity { Name = name, IsDraft = false };
        activity.ActivityTags.Add(new ActivityTag { TagId = _goalTagId });
        db.Activities.Add(activity);
        await db.SaveChangesAsync();
        return activity.Id;
    }

    [Fact]
    public async Task Regenerate_Part_ReplacesActivities_GroundedAndLogged()
    {
        await EnableAiWithCoachCredentialAsync();
        var replacementId = await SeedActivityAsync($"Regen-{Guid.NewGuid():N}");
        var hallucinatedId = replacementId + 777777;

        var draft = new TrainingDraftDto
        {
            Name = "Draft",
            Duration = 60,
            PersonsMin = 5,
            PersonsMax = 12,
            AgeGroupId = 1,
            Parts =
            [
                new TrainingDraftPartDto
                {
                    Name = "Hlavní část", Duration = 60,
                    Activities = [new TrainingDraftActivityDto { ActivityId = _activityId, ActivityName = "x" }],
                },
            ],
        };
        _factory.HttpStubs[AnthropicUrl] = CannedCompletion(
            $"{{\"name\":\"Nová hlavní část\",\"duration\":45,\"activities\":[{{\"activityId\":{replacementId}}},{{\"activityId\":{hallucinatedId}}}]}}");

        var coach = await CoachClient();
        var response = await coach.PostAsJsonAsync("/ai/training-draft/regenerate",
            new RegeneratePartRequest { Request = Request(), Draft = draft, PartIndex = 0 });
        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<RegeneratePartResultDto>();
        result!.Part.Name.Should().Be("Nová hlavní část");
        result.Part.Duration.Should().Be(60, "the original slot length is enforced");
        result.Part.Activities.Should().ContainSingle(a => a.ActivityId == replacementId);
        result.Warnings.Should().ContainSingle(w =>
            w.Code == "unknownActivity" && w.Value == hallucinatedId.ToString());
        result.Usage.InputTokens.Should().Be(30);

        // Invalid part index → coded 400.
        (await coach.PostAsJsonAsync("/ai/training-draft/regenerate",
                new RegeneratePartRequest { Request = Request(), Draft = draft, PartIndex = 5 }))
            .StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Regenerate_SwapSingleActivity_KeepsRestOfPart()
    {
        await EnableAiWithCoachCredentialAsync();
        var keepId = await SeedActivityAsync($"Keep-{Guid.NewGuid():N}");
        var replacementId = await SeedActivityAsync($"Swap-{Guid.NewGuid():N}");

        var draft = new TrainingDraftDto
        {
            Name = "Draft", Duration = 60, PersonsMin = 5, PersonsMax = 12, AgeGroupId = 1,
            Parts =
            [
                new TrainingDraftPartDto
                {
                    Name = "Část", Duration = 60,
                    Activities =
                    [
                        new TrainingDraftActivityDto { ActivityId = keepId, ActivityName = "keep" },
                        new TrainingDraftActivityDto { ActivityId = _activityId, ActivityName = "old" },
                    ],
                },
            ],
        };
        _factory.HttpStubs[AnthropicUrl] = CannedCompletion($"{{\"activityId\":{replacementId}}}");

        var coach = await CoachClient();
        var response = await coach.PostAsJsonAsync("/ai/training-draft/regenerate",
            new RegeneratePartRequest
            {
                Request = Request(), Draft = draft, PartIndex = 0, ReplaceActivityId = _activityId
            });
        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<RegeneratePartResultDto>();
        result!.Part.Activities.Select(a => a.ActivityId).Should().Equal(keepId, replacementId);
    }

    [Fact]
    public async Task SuggestActivities_GroundsCatalogIds_AndLogsActivityImportUsage()
    {
        await EnableAiWithCoachCredentialAsync();
        var invalidTagId = 987654;
        var suggestionsJson = System.Text.Json.JsonSerializer.Serialize(new
        {
            suggestions = new object[]
            {
                new
                {
                    name = "Střelba po kličce",
                    description = "Organizace: kužely na půlce.\nPrůběh: klička a zakončení.",
                    durationMin = 10, durationMax = 20, personsMin = 6, personsMax = 14,
                    tagIds = new[] { _goalTagId, invalidTagId },
                    ageGroupIds = new[] { 1 },
                    equipmentIds = Array.Empty<int>()
                }
            }
        });
        _factory.HttpStubs[AnthropicUrl] = CannedCompletion(suggestionsJson);

        var coach = await CoachClient();
        var response = await coach.PostAsJsonAsync("/ai/activities/suggest",
            new ActivitySuggestionRequest { ClubId = _clubId, Criteria = "střelecké cvičení po kličce", Count = 1 });
        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<ActivitySuggestionsResultDto>();
        var suggestion = result!.Suggestions.Single();
        suggestion.Name.Should().Be("Střelba po kličce");
        suggestion.TagIds.Should().Equal(_goalTagId);
        suggestion.AgeGroupNames.Should().ContainSingle(n => n.Contains("Kdokoliv"));
        result.Warnings.Should().ContainSingle(w =>
            w.Code == "unknownCatalogItem" && w.Value == invalidTagId.ToString());

        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        var log = await db.AiUsageLogs
            .Where(l => l.Feature == AiFeature.ActivityImport && l.UserId == _coachUserId)
            .OrderByDescending(l => l.Id)
            .FirstOrDefaultAsync();
        log.Should().NotBeNull();
        log!.Success.Should().BeTrue();
        log.ClubId.Should().Be(_clubId);

        // Foreign club in the request → 403.
        (await coach.PostAsJsonAsync("/ai/activities/suggest",
                new ActivitySuggestionRequest { ClubId = _clubId + 999999, Criteria = "cokoliv delšího", Count = 1 }))
            .StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task SuggestActivities_WebSearch_ReturnsGroundedSuggestionAndSources()
    {
        await EnableAiWithCoachCredentialAsync();
        var suggestionsJson = System.Text.Json.JsonSerializer.Serialize(new
        {
            suggestions = new object[]
            {
                new
                {
                    name = "Přesilovka 3 na 2",
                    description = "Nalezeno na trenérském webu.",
                    durationMin = 10, durationMax = 15, personsMin = 5, personsMax = 5,
                    tagIds = new[] { _goalTagId },
                    ageGroupIds = new[] { 1 },
                    equipmentIds = Array.Empty<int>()
                }
            }
        });
        // Mixed content array: server_tool_use / web_search_tool_result blocks must be
        // ignored for text extraction; citations on the text block become Sources.
        _factory.HttpStubs[AnthropicUrl] = System.Text.Json.JsonSerializer.Serialize(new
        {
            content = new object[]
            {
                new { type = "server_tool_use", id = "srv_1", name = "web_search", input = new { query = "florbal přesilovka" } },
                new
                {
                    type = "web_search_tool_result",
                    tool_use_id = "srv_1",
                    content = new object[] { new { type = "web_search_result", url = "https://floorball-coach.example/drill", title = "Floorball drill" } }
                },
                new
                {
                    type = "text",
                    text = suggestionsJson,
                    citations = new object[] { new { type = "web_search_result_location", url = "https://floorball-coach.example/drill", title = "Floorball drill" } }
                }
            },
            usage = new { input_tokens = 50, output_tokens = 20 }
        });

        var coach = await CoachClient();
        var response = await coach.PostAsJsonAsync("/ai/activities/suggest",
            new ActivitySuggestionRequest
            {
                ClubId = _clubId, Criteria = "přesilovka pro U13", Count = 1, UseWebSearch = true
            });
        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<ActivitySuggestionsResultDto>();
        result!.Suggestions.Single().Name.Should().Be("Přesilovka 3 na 2");
        result.Sources.Should().ContainSingle(s => s.Url == "https://floorball-coach.example/drill");
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
