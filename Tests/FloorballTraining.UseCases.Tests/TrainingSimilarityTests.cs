using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.Tests;

public class TrainingSimilarityTests
{
    [Fact]
    public void ComputeSignature_sorts_and_deduplicates_ids()
    {
        TrainingSimilarity.ComputeSignature(new[] { 3, 1, 2, 1 }).Should().Be("1,2,3");
    }

    [Fact]
    public void ComputeSignature_returns_null_for_empty()
    {
        TrainingSimilarity.ComputeSignature(Array.Empty<int>()).Should().BeNull();
    }

    [Fact]
    public void WeightedTimeJaccard_identical_distributions_is_one()
    {
        var a = new Dictionary<int, int> { [1] = 10, [2] = 20 };
        var b = new Dictionary<int, int> { [1] = 10, [2] = 20 };

        TrainingSimilarity.WeightedTimeJaccard(a, b).Should().Be(1.0);
    }

    [Fact]
    public void WeightedTimeJaccard_disjoint_distributions_is_zero()
    {
        var a = new Dictionary<int, int> { [1] = 10 };
        var b = new Dictionary<int, int> { [2] = 10 };

        TrainingSimilarity.WeightedTimeJaccard(a, b).Should().Be(0.0);
    }

    [Fact]
    public void WeightedTimeJaccard_partial_overlap()
    {
        // min: 1->10, max: 1->10 + 2->20 = 30 => 10/30
        var a = new Dictionary<int, int> { [1] = 10 };
        var b = new Dictionary<int, int> { [1] = 10, [2] = 20 };

        TrainingSimilarity.WeightedTimeJaccard(a, b).Should().BeApproximately(10.0 / 30.0, 1e-9);
    }

    [Fact]
    public void WeightedTimeJaccard_both_empty_is_zero()
    {
        TrainingSimilarity.WeightedTimeJaccard(
            new Dictionary<int, int>(), new Dictionary<int, int>()).Should().Be(0.0);
    }

    [Theory]
    [InlineData(60, 60, true)]
    [InlineData(60, 66, true)]   // within 15% tolerance
    [InlineData(60, 80, false)]  // beyond tolerance
    public void IsTierADuration_respects_tolerance(int a, int b, bool expected)
    {
        TrainingSimilarity.IsTierADuration(a, b).Should().Be(expected);
    }
}
