using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.CoreBusiness;

/// <summary>
/// A guardian's 1-click "we're here / cheering" at a real match (#103). The row IS the check-in —
/// the child's "family cheered" bonus is then derived from it exactly like a coach award, deduped
/// so the child never gets the bonus twice for one match (coach mark + parent check-in). The family's
/// Fan XP is a live aggregate over these rows, not a stored ledger entry.
///
/// Anti-fake: only accepted on an <see cref="AppointmentType.Match"/> within the time window
/// (<see cref="WindowOpen"/>), and only from a guardian linked to the child (#102).
/// </summary>
public class FanCheckIn : BaseEntity
{
    public int AppointmentId { get; set; }
    public Appointment? Appointment { get; set; }

    public string GuardianAppUserId { get; set; } = string.Empty;

    /// <summary>The child being cheered.</summary>
    public int MemberId { get; set; }
    public Member? Member { get; set; }

    public DateTime CheckedInAt { get; set; } = DateTime.UtcNow;

    // Time window the check-in is allowed in — you can't cheer a match that isn't on/running.
    public static readonly TimeSpan OpensBeforeStart = TimeSpan.FromHours(2);
    public static readonly TimeSpan ClosesAfterEnd = TimeSpan.FromHours(3);

    /// <summary>True when <paramref name="nowUtc"/> falls in [Start − X, End + Y] for a match.</summary>
    public static bool WindowOpen(DateTime start, DateTime end, DateTime nowUtc) =>
        nowUtc >= start - OpensBeforeStart && nowUtc <= end + ClosesAfterEnd;
}
