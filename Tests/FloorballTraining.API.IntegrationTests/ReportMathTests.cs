using FloorballTraining.API.Services.Report;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.API.IntegrationTests;

/// <summary>
/// Pure math of the player report: benchmark resolution fallback chain, colour
/// classification edges, trend direction, decline detection, weighted score
/// re-normalization and percentile ranking.
/// </summary>
public class ReportMathTests
{
    private static TestColourRange Range(
        int? ageGroupId = null, Gender? gender = null,
        double? greenFrom = 0, double? greenTo = 10, double? yellowFrom = 10, double? yellowTo = 20) => new()
    {
        AgeGroupId = ageGroupId,
        Gender = gender,
        GreenFrom = greenFrom,
        GreenTo = greenTo,
        YellowFrom = yellowFrom,
        YellowTo = yellowTo,
    };

    [Fact]
    public void ResolveColourRange_PrefersExactThenAgeThenGenderThenUniversal()
    {
        var exact = Range(ageGroupId: 5, gender: Gender.Male);
        var byAge = Range(ageGroupId: 5);
        var byGender = Range(gender: Gender.Male);
        var universal = Range();
        var all = new[] { universal, byGender, byAge, exact };

        ReportMath.ResolveColourRange(all, [5], Gender.Male).Should().BeSameAs(exact);
        ReportMath.ResolveColourRange([universal, byGender, byAge], [5], Gender.Male).Should().BeSameAs(byAge);
        ReportMath.ResolveColourRange([universal, byGender], [5], Gender.Male).Should().BeSameAs(byGender);
        ReportMath.ResolveColourRange([universal], [5], Gender.Male).Should().BeSameAs(universal);
        ReportMath.ResolveColourRange([], [5], Gender.Male).Should().BeNull();
    }

    [Theory]
    [InlineData(0, "green")]   // lower edge inclusive
    [InlineData(10, "green")]  // upper edge inclusive — green wins over yellow
    [InlineData(15, "yellow")]
    [InlineData(20, "yellow")]
    [InlineData(25, "red")]
    [InlineData(-1, "red")]
    public void ClassifyColour_UsesInclusiveEdges(double value, string expected) =>
        ReportMath.ClassifyColour(Range(), value).Should().Be(expected);

    [Fact]
    public void ClassifyColour_NoRange_ReturnsNull() =>
        ReportMath.ClassifyColour(null, 5).Should().BeNull();

    [Theory]
    [InlineData(new[] { 10.0, 11, 12, 13 }, true, 1)]    // values up + higher better = improving
    [InlineData(new[] { 10.0, 11, 12, 13 }, false, -1)]  // values up + lower better = declining
    [InlineData(new[] { 13.0, 12, 11, 10 }, false, 1)]   // sprint time falling = improving
    [InlineData(new[] { 10.0, 10.1, 10, 10.2 }, true, 0)] // within 5% tolerance = stable
    public void ComputeTrend_RespectsDirectionAndTolerance(double[] values, bool higherIsBetter, int expected) =>
        ReportMath.ComputeTrend(values, higherIsBetter).Should().Be(expected);

    [Fact]
    public void ComputeTrend_FewerThanTwoValues_ReturnsNull() =>
        ReportMath.ComputeTrend([42.0], true).Should().BeNull();

    [Theory]
    [InlineData(new[] { 10.0, 9, 8 }, true, true)]    // two drops in a row
    [InlineData(new[] { 10.0, 11, 9 }, true, false)]  // only one drop
    [InlineData(new[] { 10.0, 11, 12 }, false, true)] // lower-is-better: rising = declining
    [InlineData(new[] { 10.0, 9 }, true, false)]      // not enough steps
    public void HasConsecutiveDecline_DetectsTwoWorseSteps(double[] values, bool higherIsBetter, bool expected) =>
        ReportMath.HasConsecutiveDecline(values, higherIsBetter).Should().Be(expected);

    [Fact]
    public void WeightedScore_RenormalizesMissingComponents()
    {
        // Tests 100 (w 0.4) + attendance 50 (w 0.2), workouts/games missing
        // → (100*0.4 + 50*0.2) / 0.6 = 83.3
        ReportMath.WeightedScore((100, 0.4), (50, 0.2), (null, 0.2), (null, 0.2))
            .Should().Be(83.3);
    }

    [Fact]
    public void WeightedScore_AllMissing_ReturnsNull() =>
        ReportMath.WeightedScore((null, 0.4), (null, 0.6)).Should().BeNull();

    [Fact]
    public void ColourToScore_MapsTrafficLight()
    {
        ReportMath.ColourToScore("green").Should().Be(100);
        ReportMath.ColourToScore("yellow").Should().Be(50);
        ReportMath.ColourToScore("red").Should().Be(0);
        ReportMath.ColourToScore(null).Should().BeNull();
    }

    [Fact]
    public void Percentile_RanksAmongPeers()
    {
        ReportMath.Percentile(5, [1.0, 2, 3, 4]).Should().Be(100);
        ReportMath.Percentile(0, [1.0, 2, 3, 4]).Should().Be(0);
        ReportMath.Percentile(2.5, [1.0, 2, 3, 4]).Should().Be(50);
        ReportMath.Percentile(1, Array.Empty<double>()).Should().BeNull();
    }

    // ── Test-backed skill grading (#92) ─────────────────────────────────────

    private static TestSkillGradeRange SkillRange(
        int? ageGroupId = null, Gender? gender = null,
        double? g1From = 0, double? g1To = 5, double? g2From = 5, double? g2To = 10,
        double? g3From = 10, double? g3To = 15, double? g4From = 15, double? g4To = 20) => new()
    {
        AgeGroupId = ageGroupId,
        Gender = gender,
        Grade1From = g1From,
        Grade1To = g1To,
        Grade2From = g2From,
        Grade2To = g2To,
        Grade3From = g3From,
        Grade3To = g3To,
        Grade4From = g4From,
        Grade4To = g4To,
    };

    [Fact]
    public void ResolveSkillGradeRange_PrefersExactThenAgeThenGenderThenUniversal()
    {
        var exact = SkillRange(ageGroupId: 5, gender: Gender.Male);
        var byAge = SkillRange(ageGroupId: 5);
        var byGender = SkillRange(gender: Gender.Male);
        var universal = SkillRange();
        var all = new[] { universal, byGender, byAge, exact };

        ReportMath.ResolveSkillGradeRange(all, [5], Gender.Male).Should().BeSameAs(exact);
        ReportMath.ResolveSkillGradeRange([universal, byGender, byAge], [5], Gender.Male).Should().BeSameAs(byAge);
        ReportMath.ResolveSkillGradeRange([universal, byGender], [5], Gender.Male).Should().BeSameAs(byGender);
        ReportMath.ResolveSkillGradeRange([universal], [5], Gender.Male).Should().BeSameAs(universal);
        ReportMath.ResolveSkillGradeRange([], [5], Gender.Male).Should().BeNull();
    }

    [Theory]
    [InlineData(0, 1)]   // lower edge inclusive
    [InlineData(5, 1)]   // upper edge inclusive — grade 1 wins over grade 2
    [InlineData(7, 2)]
    [InlineData(10, 2)]
    [InlineData(12, 3)]
    [InlineData(15, 3)]
    [InlineData(17, 4)]
    [InlineData(20, 4)]
    [InlineData(25, 5)]  // beyond all explicit bands = implicit worst grade
    [InlineData(-1, 5)]
    public void ClassifySkillGrade_UsesInclusiveEdges(double value, int expected) =>
        ReportMath.ClassifySkillGrade(SkillRange(), value).Should().Be(expected);

    [Fact]
    public void ClassifySkillGrade_NoRange_ReturnsNull() =>
        ReportMath.ClassifySkillGrade(null, 5).Should().BeNull();

    [Fact]
    public void DeriveSkillGrade_GradeTypeTest_UsesGradeOptionSkillGrade()
    {
        var testDef = new TestDefinition { TestType = TestType.Grade };
        var result = new TestResult { GradeOption = new GradeOption { SkillGrade = 2 } };

        ReportMath.DeriveSkillGrade(testDef, result, [], null).Should().Be(2);
    }

    [Fact]
    public void DeriveSkillGrade_GradeTypeTest_NoSkillGradeOnOption_ReturnsNull()
    {
        var testDef = new TestDefinition { TestType = TestType.Grade };
        var result = new TestResult { GradeOption = new GradeOption { SkillGrade = null } };

        ReportMath.DeriveSkillGrade(testDef, result, [], null).Should().BeNull();
    }

    [Fact]
    public void DeriveSkillGrade_NumberTypeTest_ClassifiesAgainstResolvedRange()
    {
        var testDef = new TestDefinition
        {
            TestType = TestType.Number,
            SkillGradeRanges = [SkillRange(ageGroupId: 5)],
        };
        var result = new TestResult { NumericValue = 7 };

        ReportMath.DeriveSkillGrade(testDef, result, [5], null).Should().Be(2);
    }

    [Fact]
    public void DeriveSkillGrade_NumberTypeTest_NoNumericValue_ReturnsNull()
    {
        var testDef = new TestDefinition { TestType = TestType.Number, SkillGradeRanges = [SkillRange()] };
        var result = new TestResult { NumericValue = null };

        ReportMath.DeriveSkillGrade(testDef, result, [], null).Should().BeNull();
    }

    [Fact]
    public void DeriveSkillGrade_NumberTypeTest_NoRangeConfigured_ReturnsNull()
    {
        var testDef = new TestDefinition { TestType = TestType.Number, SkillGradeRanges = [] };
        var result = new TestResult { NumericValue = 7 };

        ReportMath.DeriveSkillGrade(testDef, result, [5], null).Should().BeNull();
    }
}
