namespace FloorballTraining.CoreBusiness.Enums;

/// <summary>
/// Scope of an owner's consent for others to use their AI credential.
/// Club = usable as the default key of one club; Global = usable as the
/// admin-defined global default. There is no per-user sharing.
/// </summary>
public enum AiConsentScope
{
    Club = 0,
    Global = 1,
}
