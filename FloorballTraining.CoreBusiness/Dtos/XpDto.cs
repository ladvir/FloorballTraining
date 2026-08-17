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

/// <summary>One row of the club/team XP-rule editor (#106): the effective value plus what it inherits.</summary>
public class XpRuleConfigDto
{
    /// <summary><see cref="Enums.XpEventType"/> name (i18n'd on the web).</summary>
    public string EventType { get; set; } = "";
    /// <summary>The code default from <see cref="XpRules"/>.</summary>
    public int DefaultPoints { get; set; }
    /// <summary>What this scope inherits without its own override: the default at club scope; the
    /// club-effective value at team scope.</summary>
    public int InheritedPoints { get; set; }
    /// <summary>Effective value for this scope: own override if set, else <see cref="InheritedPoints"/>.</summary>
    public int Points { get; set; }
    /// <summary>True when this scope has its own stored override row.</summary>
    public bool IsCustomized { get; set; }
    /// <summary>False for member-level events (skill/test/home) that can't take a team override.</summary>
    public bool TeamScopable { get; set; }
}

/// <summary>One earnable reward in the member-facing "How to earn XP" catalog (#107). Title and
/// description are i18n keys the client builds from <see cref="Code"/> (xp.type.{code} /
/// xp.howto.desc.{code}), so no localized text travels over the wire.</summary>
public class XpRuleCatalogItemDto
{
    /// <summary><see cref="Enums.XpEventType"/> name.</summary>
    public string Code { get; set; } = "";
    /// <summary>Effective club value: the #106 club override if set, else the <see cref="XpRules"/> default.</summary>
    public int Points { get; set; }
    /// <summary>Reward layer: "A" automatic, "B" coach-granted, "C" capped self-report.</summary>
    public string Layer { get; set; } = "";
    /// <summary>Who triggers it: "player" | "coach" | "parent".</summary>
    public string Trigger { get; set; } = "";
    /// <summary>True for the "what I can do myself" set (everything except the coach/family bonuses).</summary>
    public bool SelfActionable { get; set; }
}

public class UpdateXpRulesRequest
{
    public int ClubId { get; set; }
    /// <summary>Null = edit the club-wide values; set = edit one team's overrides.</summary>
    public int? TeamId { get; set; }
    public List<XpRuleItemDto> Items { get; set; } = [];
}

public class XpRuleItemDto
{
    public string EventType { get; set; } = "";
    public int Points { get; set; }
}

/// <summary>One challenge's live progress for a member (#108). Title/desc are i18n keys the client builds
/// from <see cref="Code"/> (challenge.{code}.title / .desc), so no localized text travels over the wire.</summary>
public class ChallengeDto
{
    /// <summary><see cref="Enums"/> <c>ChallengeCode</c> name.</summary>
    public string Code { get; set; } = "";
    /// <summary><c>ChallengeMetric</c> name.</summary>
    public string Metric { get; set; } = "";
    /// <summary><c>ChallengeWindow</c> name: Week | Month | Season.</summary>
    public string Window { get; set; } = "";
    /// <summary>The window this figure belongs to, e.g. "2026-W31".</summary>
    public string PeriodKey { get; set; } = "";
    public int Target { get; set; }
    /// <summary>Progress count in the window (clamped to <see cref="Target"/> for display).</summary>
    public int Current { get; set; }
    /// <summary>0..1.</summary>
    public double Progress { get; set; }
    public int RewardXp { get; set; }
    public bool Completed { get; set; }
    public DateTime? CompletedAt { get; set; }
}

/// <summary>A member's challenge board (#108): what is in progress now + what was recently earned.</summary>
public class ChallengesDto
{
    public List<ChallengeDto> Active { get; set; } = [];
    public List<ChallengeDto> RecentlyCompleted { get; set; } = [];
}

/// <summary>Admin-only XP reset cutoff (per club) — see XpController.SetXpCountFrom.</summary>
public class SetXpCountFromDto
{
    public int ClubId { get; set; }
    public DateTime? XpCountFromDate { get; set; }
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
