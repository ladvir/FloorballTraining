namespace FloorballTraining.CoreBusiness.Enums;

/// <summary>
/// Collectible milestone badges (#97). Each tier is its own code; a code is earned once per member,
/// or once per season for season-scoped badges (Iron Man). Stored as int.
/// </summary>
public enum BadgeCode
{
    Attendance10,
    Attendance25,
    Attendance50,
    Attendance100,
    FirstGoal,
    Goals10,
    Goals50,
    Hattrick,
    Assists10,
    Assists25,
    IronMan,
    Loyalty3
}
