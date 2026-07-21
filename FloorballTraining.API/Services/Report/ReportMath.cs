using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.API.Services.Report;

/// <summary>
/// Pure math of the player report (Feat15 #48): benchmark colour classification
/// (same fallback chain as TestResultsController), performance trend, the
/// strengths/weaknesses heuristic inputs and the weighted quality score.
/// Kept free of EF/HTTP so it is unit-testable.
/// </summary>
public static class ReportMath
{
    // ── Benchmark colours ────────────────────────────────────────────────────

    /// <summary>
    /// Picks the benchmark range for a member: exact (age group + gender) →
    /// age group only → gender only → universal.
    /// </summary>
    public static TestColourRange? ResolveColourRange(
        IReadOnlyCollection<TestColourRange> ranges,
        IReadOnlyCollection<int> memberAgeGroupIds,
        Gender? gender)
    {
        foreach (var ageGroupId in memberAgeGroupIds)
        {
            var exact = ranges.FirstOrDefault(c => c.AgeGroupId == ageGroupId && c.Gender == gender);
            if (exact != null) return exact;
        }
        foreach (var ageGroupId in memberAgeGroupIds)
        {
            var byAge = ranges.FirstOrDefault(c => c.AgeGroupId == ageGroupId && c.Gender == null);
            if (byAge != null) return byAge;
        }
        return ranges.FirstOrDefault(c => c.AgeGroupId == null && c.Gender == gender)
               ?? ranges.FirstOrDefault(c => c.AgeGroupId == null && c.Gender == null);
    }

    public static string? ClassifyColour(TestColourRange? range, double value)
    {
        if (range == null) return null;

        if (range.GreenFrom.HasValue && range.GreenTo.HasValue &&
            value >= range.GreenFrom.Value && value <= range.GreenTo.Value)
            return "green";

        if (range.YellowFrom.HasValue && range.YellowTo.HasValue &&
            value >= range.YellowFrom.Value && value <= range.YellowTo.Value)
            return "yellow";

        return "red";
    }

    public static string? FormatBenchmark(TestColourRange? range, string? unit)
    {
        if (range?.GreenFrom == null || range.GreenTo == null) return null;
        var suffix = string.IsNullOrEmpty(unit) ? "" : $" {unit}";
        return $"{range.GreenFrom.Value:0.##}–{range.GreenTo.Value:0.##}{suffix}";
    }

    // ── Test-backed skill grading (#92) ─────────────────────────────────────

    /// <summary>
    /// Picks the skill-grade range for a member: exact (age group + gender) →
    /// age group only → gender only → universal. Same fallback chain as ResolveColourRange.
    /// </summary>
    public static TestSkillGradeRange? ResolveSkillGradeRange(
        IReadOnlyCollection<TestSkillGradeRange> ranges,
        IReadOnlyCollection<int> memberAgeGroupIds,
        Gender? gender)
    {
        foreach (var ageGroupId in memberAgeGroupIds)
        {
            var exact = ranges.FirstOrDefault(c => c.AgeGroupId == ageGroupId && c.Gender == gender);
            if (exact != null) return exact;
        }
        foreach (var ageGroupId in memberAgeGroupIds)
        {
            var byAge = ranges.FirstOrDefault(c => c.AgeGroupId == ageGroupId && c.Gender == null);
            if (byAge != null) return byAge;
        }
        return ranges.FirstOrDefault(c => c.AgeGroupId == null && c.Gender == gender)
               ?? ranges.FirstOrDefault(c => c.AgeGroupId == null && c.Gender == null);
    }

    /// <summary>Classifies a raw value into a 1 (best) – 5 (worst) skill grade; band 5 is the implicit "else".</summary>
    public static int? ClassifySkillGrade(TestSkillGradeRange? range, double value)
    {
        if (range == null) return null;

        if (range.Grade1From.HasValue && range.Grade1To.HasValue &&
            value >= range.Grade1From.Value && value <= range.Grade1To.Value)
            return 1;

        if (range.Grade2From.HasValue && range.Grade2To.HasValue &&
            value >= range.Grade2From.Value && value <= range.Grade2To.Value)
            return 2;

        if (range.Grade3From.HasValue && range.Grade3To.HasValue &&
            value >= range.Grade3From.Value && value <= range.Grade3To.Value)
            return 3;

        if (range.Grade4From.HasValue && range.Grade4To.HasValue &&
            value >= range.Grade4From.Value && value <= range.Grade4To.Value)
            return 4;

        return 5;
    }

    /// <summary>
    /// Derives a 1-5 skill grade from a recorded test result: Grade-type tests use the
    /// picked option's fixed SkillGrade; Number-type tests classify the raw value against
    /// the member's age/gender-resolved TestSkillGradeRange. Null when nothing can be derived
    /// (e.g. no range configured, or no numeric value/grade option on the result).
    /// </summary>
    public static int? DeriveSkillGrade(
        TestDefinition testDef,
        TestResult result,
        IReadOnlyCollection<int> memberAgeGroupIds,
        Gender? gender)
    {
        if (testDef.TestType == TestType.Grade)
            return result.GradeOption?.SkillGrade;

        if (result.NumericValue == null) return null;

        var range = ResolveSkillGradeRange(testDef.SkillGradeRanges, memberAgeGroupIds, gender);
        return ClassifySkillGrade(range, result.NumericValue.Value);
    }

    // ── Trend ────────────────────────────────────────────────────────────────

    /// <summary>
    /// Performance direction over chronological values: 1 improving, 0 stable,
    /// -1 declining; null with fewer than 2 values. Compares the average of the
    /// second half against the first half with a 5% relative tolerance, flipped
    /// for lower-is-better tests.
    /// </summary>
    public static int? ComputeTrend(IReadOnlyList<double> chronologicalValues, bool higherIsBetter)
    {
        if (chronologicalValues.Count < 2) return null;

        var half = chronologicalValues.Count / 2;
        var firstAvg = chronologicalValues.Take(chronologicalValues.Count - half).Average();
        var secondAvg = chronologicalValues.Skip(chronologicalValues.Count - half).Average();

        var reference = Math.Max(Math.Abs(firstAvg), 1e-9);
        var relativeChange = (secondAvg - firstAvg) / reference;
        if (Math.Abs(relativeChange) < 0.05) return 0;

        var valueWentUp = relativeChange > 0;
        return valueWentUp == higherIsBetter ? 1 : -1;
    }

    /// <summary>True when the last `count` steps each got worse (weakness signal).</summary>
    public static bool HasConsecutiveDecline(
        IReadOnlyList<double> chronologicalValues, bool higherIsBetter, int count = 2)
    {
        if (chronologicalValues.Count < count + 1) return false;

        for (var i = chronologicalValues.Count - count; i < chronologicalValues.Count; i++)
        {
            var worse = higherIsBetter
                ? chronologicalValues[i] < chronologicalValues[i - 1]
                : chronologicalValues[i] > chronologicalValues[i - 1];
            if (!worse) return false;
        }
        return true;
    }

    // ── Quality score ────────────────────────────────────────────────────────

    public static double? ColourToScore(string? colour) => colour switch
    {
        "green" => 100,
        "yellow" => 50,
        "red" => 0,
        _ => null,
    };

    /// <summary>
    /// Weighted composite of the available components; weights of missing
    /// components (null score) are re-normalized away. Null when nothing has data.
    /// </summary>
    public static double? WeightedScore(params (double? Score, double Weight)[] components)
    {
        var present = components.Where(c => c.Score.HasValue && c.Weight > 0).ToList();
        if (present.Count == 0) return null;

        var weightSum = present.Sum(c => c.Weight);
        if (weightSum <= 0) return null;

        var score = present.Sum(c => c.Score!.Value * c.Weight) / weightSum;
        return Math.Round(Math.Clamp(score, 0, 100), 1);
    }

    /// <summary>Percentile (0–100) of a value among its peers (inclusive rank).</summary>
    public static double? Percentile(double value, IReadOnlyCollection<double> peers)
    {
        if (peers.Count == 0) return null;
        var below = peers.Count(p => p < value);
        var equal = peers.Count(p => p == value);
        return Math.Round((below + equal * 0.5) / peers.Count * 100, 1);
    }
}
