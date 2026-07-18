using FloorballTraining.API.Services.Ai;

namespace FloorballTraining.API.IntegrationTests;

/// <summary>
/// Pure parsing of AI activity import proposals: catalog-id grounding
/// (unknown ids dropped with warnings), range clamping and the count cap.
/// </summary>
public class ActivitySuggestionPromptBuilderTests
{
    private static readonly List<CatalogItem> Tags = [new(10, "Střelba"), new(11, "Přihrávky")];
    private static readonly List<CatalogItem> AgeGroups = [new(1, "Kdokoliv"), new(5, "U13")];
    private static readonly List<CatalogItem> Equipment = [new(20, "Kužely")];

    [Fact]
    public void ParseAndValidate_ResolvesCatalogNames_AndDropsUnknownIds()
    {
        const string text = """
            {"suggestions":[{"name":"Střelba z první","description":"Organizace: ...\nPrůběh: ...",
             "durationMin":10,"durationMax":20,"personsMin":8,"personsMax":14,
             "tagIds":[10,999],"ageGroupIds":[5],"equipmentIds":[20,888]}]}
            """;

        var (suggestions, warnings, error) =
            ActivitySuggestionPromptBuilder.ParseAndValidate(text, Tags, AgeGroups, Equipment);

        error.Should().BeNull();
        var suggestion = suggestions!.Single();
        suggestion.Name.Should().Be("Střelba z první");
        suggestion.TagIds.Should().Equal(10);
        suggestion.TagNames.Should().Equal("Střelba");
        suggestion.AgeGroupNames.Should().Equal("U13");
        suggestion.EquipmentNames.Should().Equal("Kužely");
        warnings.Should().HaveCount(2);
        warnings.Should().OnlyContain(w => w.Code == "unknownCatalogItem");
    }

    [Fact]
    public void ParseAndValidate_ClampsRangesAndCapsCount()
    {
        var one = """{"name":"N","description":"D","durationMin":-5,"durationMax":999,"personsMin":0,"personsMax":500,"tagIds":[],"ageGroupIds":[],"equipmentIds":[]}""";
        var text = $$"""{"suggestions":[{{one}},{{one}},{{one}},{{one}},{{one}}]}""";

        var (suggestions, _, error) =
            ActivitySuggestionPromptBuilder.ParseAndValidate(text, Tags, AgeGroups, Equipment);

        error.Should().BeNull();
        suggestions!.Should().HaveCount(ActivitySuggestionPromptBuilder.MaxCount);
        var s = suggestions[0];
        s.DurationMin.Should().Be(1);
        s.DurationMax.Should().Be(240);
        s.PersonsMin.Should().Be(1);
        s.PersonsMax.Should().Be(99);
    }

    [Theory]
    [InlineData("no json", "noJson")]
    [InlineData("{\"suggestions\": [broken}", "invalidJson")]
    [InlineData("{\"suggestions\":[]}", "emptyDraft")]
    [InlineData("{\"suggestions\":[{\"name\":\"\",\"description\":\"\"}]}", "emptyDraft")]
    public void ParseAndValidate_UnusableOutput_ReturnsErrorCode(string text, string expectedError)
    {
        var (suggestions, _, error) =
            ActivitySuggestionPromptBuilder.ParseAndValidate(text, Tags, AgeGroups, Equipment);

        suggestions.Should().BeNull();
        error.Should().Be(expectedError);
    }
}
