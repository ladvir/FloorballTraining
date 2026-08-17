using FloorballTraining.API.Services.Ai;
using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.API.IntegrationTests;

/// <summary>
/// Pure tests of the AI draft grounding: JSON extraction from model prose and the
/// validation that drops hallucinated activity ids and flags duration mismatches.
/// </summary>
public class TrainingPromptBuilderTests
{
    private static readonly List<ActivityCandidate> Candidates =
    [
        new(1, "Rozcvička s míčkem", "Zahřátí", 5, 15, 4, 30, 3, ["rozcvičení"]),
        new(2, "Střelba z křídel", "Střelecké cvičení", 10, 20, 6, 20, 7, ["střelba"]),
    ];

    private static TrainingGenerationRequest Request(int duration = 60) => new()
    {
        ClubId = 1,
        GoalTagIds = [10],
        AgeGroupId = 1,
        DurationMinutes = duration,
        PersonsMin = 6,
        PersonsMax = 12,
    };

    [Theory]
    [InlineData("{\"a\":1}", "{\"a\":1}")]
    [InlineData("Tady je trénink:\n```json\n{\"a\":1}\n```\nHotovo.", "{\"a\":1}")]
    [InlineData("prefix {\"a\":{\"b\":\"te}xt\"}} suffix", "{\"a\":{\"b\":\"te}xt\"}}")]
    public void ExtractJson_FindsTheObject(string input, string expected) =>
        TrainingPromptBuilder.ExtractJson(input).Should().Be(expected);

    [Theory]
    [InlineData("")]
    [InlineData("no json here")]
    [InlineData("{\"unterminated\": ")]
    public void ExtractJson_ReturnsNullWhenMissingOrTruncated(string input) =>
        TrainingPromptBuilder.ExtractJson(input).Should().BeNull();

    [Fact]
    public void ParseAndValidate_ValidDraft_MapsNamesAndRequestFields()
    {
        const string text = """
            {"name":"Trénink střelby","description":"Zaměřeno na zakončení",
             "parts":[{"name":"Úvod","duration":15,"activities":[{"activityId":1}]},
                      {"name":"Hlavní část","duration":45,"activities":[{"activityId":2}]}]}
            """;

        var (draft, warnings, error) = TrainingPromptBuilder.ParseAndValidate(text, Request(), Candidates);

        error.Should().BeNull();
        warnings.Should().BeEmpty();
        draft!.Name.Should().Be("Trénink střelby");
        draft.Duration.Should().Be(60);
        draft.PersonsMin.Should().Be(6);
        draft.AgeGroupId.Should().Be(1);
        draft.GoalTagIds.Should().Equal(10);
        draft.Parts.Should().HaveCount(2);
        draft.Parts[1].Activities.Single().ActivityName.Should().Be("Střelba z křídel");
    }

    [Fact]
    public void ParseAndValidate_HallucinatedActivity_IsDroppedWithWarning()
    {
        const string text = """
            {"name":"T","parts":[{"name":"P","duration":60,
             "activities":[{"activityId":1},{"activityId":999}]}]}
            """;

        var (draft, warnings, error) = TrainingPromptBuilder.ParseAndValidate(text, Request(), Candidates);

        error.Should().BeNull();
        draft!.Parts.Single().Activities.Should().ContainSingle(a => a.ActivityId == 1);
        warnings.Should().ContainSingle(w => w.Code == "unknownActivity" && w.Value == "999");
    }

    [Fact]
    public void ParseAndValidate_OnlyHallucinatedActivities_FailsAsEmptyDraft()
    {
        const string text = """
            {"name":"T","parts":[{"name":"P","duration":60,"activities":[{"activityId":999}]}]}
            """;

        var (draft, _, error) = TrainingPromptBuilder.ParseAndValidate(text, Request(), Candidates);

        draft.Should().BeNull();
        error.Should().Be("emptyDraft");
    }

    [Fact]
    public void ParseAndValidate_DurationFarFromRequested_AddsWarning()
    {
        const string text = """
            {"name":"T","parts":[{"name":"P","duration":30,"activities":[{"activityId":1}]}]}
            """;

        var (draft, warnings, _) = TrainingPromptBuilder.ParseAndValidate(text, Request(duration: 90), Candidates);

        draft!.Duration.Should().Be(30);
        warnings.Should().ContainSingle(w => w.Code == "durationMismatch" && w.Value == "30");
    }

    [Theory]
    [InlineData("prose without json", "noJson")]
    [InlineData("{\"name\": [broken}", "invalidJson")]
    [InlineData("{\"name\":\"T\",\"parts\":[]}", "emptyDraft")]
    public void ParseAndValidate_UnusableModelOutput_ReturnsErrorCode(string text, string expectedError)
    {
        var (draft, _, error) = TrainingPromptBuilder.ParseAndValidate(text, Request(), Candidates);

        draft.Should().BeNull();
        error.Should().Be(expectedError);
    }

    // ── Part regeneration / activity swap (etapa #77) ────────────────────────

    private static TrainingDraftPartDto OriginalPart(params int[] activityIds) => new()
    {
        Name = "Hlavní část",
        Duration = 30,
        Activities = activityIds
            .Select(id => new TrainingDraftActivityDto { ActivityId = id, ActivityName = $"A{id}" })
            .ToList(),
    };

    [Fact]
    public void ParseRegeneratedPart_KeepsOriginalDuration_DropsHallucinatedAndDuplicates()
    {
        const string text = """
            {"name":"Nová část","description":"Jinak","duration":99,
             "activities":[{"activityId":1},{"activityId":999},{"activityId":2}]}
            """;
        // Activity 2 is used by ANOTHER part of the draft → must be dropped as duplicate.
        var (part, warnings, error) = TrainingPromptBuilder.ParseRegeneratedPart(
            text, OriginalPart(1), Candidates, usedElsewhere: new HashSet<int> { 2 });

        error.Should().BeNull();
        part!.Name.Should().Be("Nová část");
        part.Duration.Should().Be(30, "the original slot length is enforced");
        part.Activities.Should().ContainSingle(a => a.ActivityId == 1);
        warnings.Should().ContainSingle(w => w.Code == "unknownActivity" && w.Value == "999");
        warnings.Should().ContainSingle(w => w.Code == "duplicateActivity" && w.Value == "2");
    }

    [Fact]
    public void ParseRegeneratedPart_OnlyInvalidActivities_FailsAsEmptyDraft()
    {
        const string text = """{"name":"N","duration":30,"activities":[{"activityId":999}]}""";
        var (part, _, error) = TrainingPromptBuilder.ParseRegeneratedPart(
            text, OriginalPart(1), Candidates, new HashSet<int>());

        part.Should().BeNull();
        error.Should().Be("emptyDraft");
    }

    [Fact]
    public void ParseActivitySwap_ReplacesJustTheOneActivity()
    {
        var (part, warnings, error) = TrainingPromptBuilder.ParseActivitySwap(
            """{"activityId":2}""", OriginalPart(1), replaceActivityId: 1, Candidates, new HashSet<int>());

        error.Should().BeNull();
        warnings.Should().BeEmpty();
        part!.Activities.Should().ContainSingle(a => a.ActivityId == 2 && a.ActivityName == "Střelba z křídel");
    }

    [Theory]
    [InlineData("""{"activityId":1}""")]  // same as the replaced one
    [InlineData("""{"activityId":999}""")] // hallucinated
    public void ParseActivitySwap_InvalidReplacement_FailsWithNoReplacement(string text)
    {
        var (part, warnings, error) = TrainingPromptBuilder.ParseActivitySwap(
            text, OriginalPart(1), replaceActivityId: 1, Candidates, new HashSet<int>());

        part.Should().BeNull();
        error.Should().Be("noReplacement");
        warnings.Should().NotBeEmpty();
    }

    [Fact]
    public void UsedElsewhere_CollectsActivityIdsOfOtherParts()
    {
        var draft = new TrainingDraftDto
        {
            Parts = [OriginalPart(1), OriginalPart(2), OriginalPart(1, 2)],
        };
        TrainingPromptBuilder.UsedElsewhere(draft, partIndex: 2).Should().BeEquivalentTo([1, 2]);
        TrainingPromptBuilder.UsedElsewhere(draft, partIndex: 0).Should().BeEquivalentTo([1, 2]);
    }
}
