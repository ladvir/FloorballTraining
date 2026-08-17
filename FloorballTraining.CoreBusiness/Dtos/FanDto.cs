namespace FloorballTraining.CoreBusiness.Dtos;

/// <summary>A guardian's child with the matches they can cheer plus the family's Fan XP and streak (#103).</summary>
public class FanChildDto
{
    public int MemberId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    /// <summary>Family Fan XP = <see cref="XpRules.FanCheckInFamilyXp"/> × all guardians' check-ins for this child.</summary>
    public int FamilyXp { get; set; }
    /// <summary>Consecutive most-recent started matches with a family check-in.</summary>
    public int CheerStreak { get; set; }
    public List<FanMatchDto> Matches { get; set; } = [];
}

/// <summary>One of a child's upcoming/current matches, with whether this guardian can check in now.</summary>
public class FanMatchDto
{
    public int AppointmentId { get; set; }
    public string? Name { get; set; }
    public DateTime Start { get; set; }
    public DateTime End { get; set; }
    /// <summary>Match is a real match, in the time window, and this guardian hasn't checked in yet.</summary>
    public bool CanCheckIn { get; set; }
    /// <summary>This guardian already checked in for this match/child.</summary>
    public bool CheckedIn { get; set; }
}

/// <summary>POST /fan/checkin body — the guardian cheers their child at a match.</summary>
public class FanCheckInRequest
{
    public int AppointmentId { get; set; }
    public int MemberId { get; set; }
}
