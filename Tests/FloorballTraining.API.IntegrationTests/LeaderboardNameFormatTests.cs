using FloorballTraining.API.Services;
using FluentAssertions;
using Xunit;

namespace FloorballTraining.API.IntegrationTests;

// Pure formatting check for the leaderboard display name (user request): "PŘÍJMENÍ Jméno".
public class LeaderboardNameFormatTests
{
    [Theory]
    [InlineData("Jan", "Novák", "NOVÁK Jan")]
    [InlineData("JAN", "novák", "NOVÁK Jan")]      // normalises whatever casing is stored
    [InlineData("anna", "SVOBODOVÁ", "SVOBODOVÁ Anna")]
    [InlineData("", "Dvořák", "DVOŘÁK")]           // missing first name → surname only, no stray space
    [InlineData("Petr", "", "Petr")]                // missing surname → first name only, still title-case
    public void Formats_surname_upper_firstname_titlecase(string first, string last, string expected)
        => LeaderboardService.FormatName(first, last).Should().Be(expected);
}
