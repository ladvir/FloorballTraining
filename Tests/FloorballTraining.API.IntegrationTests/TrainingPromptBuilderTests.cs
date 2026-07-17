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
}
