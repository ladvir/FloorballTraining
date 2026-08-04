namespace FloorballTraining.CoreBusiness.Dtos;

public class XpSummaryDto
{
    public int MemberId { get; set; }
    public int TotalXp { get; set; }
    /// <summary>Lifetime career rank + level derived from <see cref="TotalXp"/> (#95).</summary>
    public CareerXp Career { get; set; } = new();
    public List<SeasonXpDto> BySeason { get; set; } = [];
    /// <summary>Lifetime XP grouped by source event type — the motivational "where did my XP come from" breakdown (#99).</summary>
    public List<XpByTypeDto> ByType { get; set; } = [];

    // Capped self-report transparency (#104): show the player that home training alone can't carry their level.
    /// <summary>Uncapped sum of confirmed home-training logs.</summary>
    public int RawHomeXp { get; set; }
    /// <summary>Home XP that actually counts after the cap = min(RawHomeXp, capPct × non-home XP).</summary>
    public int CountedHomeXp { get; set; }
    /// <summary>The current cap value (capPct × non-home XP); 0 when the player has no non-home XP.</summary>
    public int HomeXpCap { get; set; }
}

/// <summary>Lifetime XP for one <see cref="Enums.XpEventType"/> (stored as its enum name for i18n on the web).</summary>
public class XpByTypeDto
{
    public string Type { get; set; } = "";
    public int Xp { get; set; }
}

/// <summary>A coach 1-click bonus (layer B, #100). <see cref="Type"/> is the <see cref="Enums.AwardType"/> name.</summary>
public class XpAwardDto
{
    public int Id { get; set; }
    public int AppointmentId { get; set; }
    public int MemberId { get; set; }
    public string Type { get; set; } = "";
    public string AwardedByUserId { get; set; } = "";
    public DateTime AwardedAt { get; set; }
}

public class CreateXpAwardDto
{
    public int AppointmentId { get; set; }
    public int MemberId { get; set; }
    /// <summary><see cref="Enums.AwardType"/> name: PlayerOfTraining | FairPlay | FamilyCheered.</summary>
    public string Type { get; set; } = "";
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
