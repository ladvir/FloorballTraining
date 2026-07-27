namespace FloorballTraining.CoreBusiness.Dtos;

public class XpSummaryDto
{
    public int MemberId { get; set; }
    public int TotalXp { get; set; }
    /// <summary>Lifetime career rank + level derived from <see cref="TotalXp"/> (#95).</summary>
    public CareerXp Career { get; set; } = new();
    public List<SeasonXpDto> BySeason { get; set; } = [];
}

public class SeasonXpDto
{
    public int SeasonId { get; set; }
    public int Xp { get; set; }
    /// <summary>Seasonal form 1..5 derived from <see cref="Xp"/> — resets each season, drives fair leaderboards (#95).</summary>
    public int Stars { get; set; }
}

/// <summary>Career progression derived from lifetime XP: current rank, level, and progress to next level/rank (#95).</summary>
public class CareerXp
{
    public int TotalXp { get; set; }
    public int RankIndex { get; set; }
    public string Rank { get; set; } = "";
    public int Level { get; set; }
    public int XpToNextLevel { get; set; }
    /// <summary>0..1 progress within the current level.</summary>
    public double LevelProgress { get; set; }
    /// <summary>Null at the top rank (Legenda).</summary>
    public string? NextRank { get; set; }
    /// <summary>Null at the top rank.</summary>
    public int? XpToNextRank { get; set; }
    /// <summary>0..1 progress from the current rank floor to the next; 1.0 at the top rank.</summary>
    public double RankProgress { get; set; }
}
