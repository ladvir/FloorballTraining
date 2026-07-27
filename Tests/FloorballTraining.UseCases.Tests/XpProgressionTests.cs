using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.Tests;

/// <summary>
/// Pure derivation of career rank/level + seasonal form from XP (#95). Focuses on threshold boundaries.
/// </summary>
public class XpProgressionTests
{
    [Theory]
    [InlineData(0, 0, "Nováček")]
    [InlineData(99, 0, "Nováček")]
    [InlineData(100, 1, "Hráč")]     // exact threshold enters the rank
    [InlineData(299, 1, "Hráč")]
    [InlineData(300, 2, "Stálice")]
    [InlineData(700, 3, "Opora")]
    [InlineData(1500, 4, "Lídr")]
    [InlineData(3000, 5, "Kapitán")]
    [InlineData(5999, 5, "Kapitán")]
    [InlineData(6000, 6, "Legenda")]
    [InlineData(99999, 6, "Legenda")]
    public void Career_maps_xp_to_rank_at_boundaries(int xp, int rankIndex, string rank)
    {
        var c = XpProgression.Career(xp);
        c.RankIndex.Should().Be(rankIndex);
        c.Rank.Should().Be(rank);
    }

    [Fact]
    public void Career_level_counts_within_rank_and_resets_on_promotion()
    {
        XpProgression.Career(700).Level.Should().Be(1);   // Opora floor
        XpProgression.Career(799).Level.Should().Be(1);
        XpProgression.Career(800).Level.Should().Be(2);
        XpProgression.Career(1499).Level.Should().Be(8);  // last level before Lídr
        XpProgression.Career(1500).Level.Should().Be(1);  // promotion resets level
    }

    [Fact]
    public void Career_reports_progress_to_next_level_and_rank()
    {
        var c = XpProgression.Career(750); // Opora (floor 700), next rank Lídr at 1500
        c.XpToNextLevel.Should().Be(50);
        c.LevelProgress.Should().BeApproximately(0.5, 1e-9);
        c.NextRank.Should().Be("Lídr");
        c.XpToNextRank.Should().Be(750);
        c.RankProgress.Should().BeApproximately(50 / 800.0, 1e-9);
    }

    [Fact]
    public void Career_top_rank_has_no_next_and_full_rank_progress()
    {
        var c = XpProgression.Career(8600); // Legenda
        c.NextRank.Should().BeNull();
        c.XpToNextRank.Should().BeNull();
        c.RankProgress.Should().Be(1.0);
        c.Level.Should().Be(27); // (8600-6000)/100 + 1
    }

    [Fact]
    public void Career_clamps_negative_xp_to_zero()
    {
        XpProgression.Career(-50).RankIndex.Should().Be(0);
    }

    [Theory]
    [InlineData(0, 1)]
    [InlineData(49, 1)]
    [InlineData(50, 2)]
    [InlineData(149, 2)]
    [InlineData(150, 3)]
    [InlineData(300, 4)]
    [InlineData(499, 4)]
    [InlineData(500, 5)]
    [InlineData(9999, 5)]
    public void Stars_maps_season_xp_at_boundaries(int seasonXp, int stars)
    {
        XpProgression.Stars(seasonXp).Should().Be(stars);
    }
}
