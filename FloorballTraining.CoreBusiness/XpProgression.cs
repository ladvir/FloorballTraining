using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.CoreBusiness;

/// <summary>
/// Derives career rank + level (lifetime) and seasonal form (per-season stars) from accumulated XP.
/// Pure — no DB, fully unit-testable. All thresholds live here (placeholder constants, tunable later, #93 epic).
/// ponytail: flat const tables; move to a config/DbSet only if clubs need per-club thresholds.
/// </summary>
public static class XpProgression
{
    /// <summary>Career ranks (Czech domain terms) with their lifetime-XP floor, ascending. Never resets.</summary>
    public static readonly (string Name, int Floor)[] Ranks =
    [
        ("Nováček", 0),
        ("Hráč", 100),
        ("Stálice", 300),
        ("Opora", 700),
        ("Lídr", 1500),
        ("Kapitán", 3000),
        ("Legenda", 6000),
    ];

    /// <summary>XP per level ("každých 100 XP = +1 level"). Rank widths are all multiples of this, so levels divide evenly.</summary>
    public const int XpPerLevel = 100;

    /// <summary>Season-XP floors for form stars 1..5 (index i → i+1 stars). Tunable placeholder.</summary>
    public static readonly int[] SeasonFormFloors = [0, 50, 150, 300, 500];

    /// <summary>Career rank/level/progress from lifetime XP.</summary>
    public static CareerXp Career(int totalXp)
    {
        var xp = Math.Max(0, totalXp);

        var i = 0;
        while (i + 1 < Ranks.Length && xp >= Ranks[i + 1].Floor) i++;

        var rankFloor = Ranks[i].Floor;
        var isMax = i == Ranks.Length - 1;
        var withinRank = xp - rankFloor;

        return new CareerXp
        {
            TotalXp = xp,
            RankIndex = i,
            Rank = Ranks[i].Name,
            // Level counts within the rank ("Uvnitř hodnosti"); resets to 1 at each new rank.
            Level = withinRank / XpPerLevel + 1,
            XpToNextLevel = XpPerLevel - withinRank % XpPerLevel,
            LevelProgress = withinRank % XpPerLevel / (double)XpPerLevel,
            NextRank = isMax ? null : Ranks[i + 1].Name,
            XpToNextRank = isMax ? null : Ranks[i + 1].Floor - xp,
            RankProgress = isMax ? 1.0 : withinRank / (double)(Ranks[i + 1].Floor - rankFloor),
        };
    }

    /// <summary>Seasonal form: 1..5 stars from the season's XP. Used for fair (handicap-free) leaderboards.</summary>
    public static int Stars(int seasonXp)
    {
        var stars = 1;
        while (stars < SeasonFormFloors.Length && seasonXp >= SeasonFormFloors[stars]) stars++;
        return stars;
    }
}
