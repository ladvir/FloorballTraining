namespace FloorballTraining.CoreBusiness;

/// <summary>How often a badge can be earned: once ever, or once per calendar month / club season.</summary>
public enum BadgePeriod { Lifetime, Month, Season }

/// <summary>
/// An admin-managed badge definition. Seeded once from <see cref="BadgeCatalog.All"/>, after that the table is
/// the source of truth. Name/Description are optional overrides: when null the client uses the
/// badge.{Code}.name / .desc i18n keys (built-in badges), otherwise it shows these (custom badges).
/// Removing a badge sets <see cref="IsActive"/> = false (already-earned MemberBadge rows stay).
/// </summary>
public class BadgeDefinition : BaseEntity
{
    public string Code { get; set; } = "";
    public BadgeMetric Metric { get; set; }
    public int Threshold { get; set; }
    public BadgePeriod Period { get; set; }
    /// <summary>Lifetime only: earned again for every further multiple of <see cref="Threshold"/>.</summary>
    public bool Repeatable { get; set; }
    /// <summary>Path under wwwroot (e.g. "badges/attendance10.png").</summary>
    public string IconPath { get; set; } = "";
    public string? Name { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
}
