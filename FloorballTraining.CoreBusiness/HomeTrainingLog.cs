namespace FloorballTraining.CoreBusiness;

/// <summary>
/// A player's self-reported home training (#104). A "home training" is just an individual
/// <see cref="Training"/> (<see cref="Training.IsIndividual"/>) the player did alone at home — there is
/// no separate concept. The row is the log; it drives a **capped** XP layer (the only self-report source,
/// hence the most anti-cheat):
///   1. Counter-sign — XP is derived only from a log a guardian (#102) or coach has confirmed
///      (<see cref="ConfirmedAt"/> set, <see cref="RejectedAt"/> null). Unconfirmed = 0 XP.
///   2. Cap — counted home XP never exceeds capPct × the player's non-home ("earned") XP (see XpService).
///   3. Rate limit — max one log per day per member (enforced on create).
/// On create it also spawns a personal <see cref="Appointment"/> so the training shows on the player's
/// calendar as an event (<see cref="AppointmentId"/>).
/// </summary>
public class HomeTrainingLog : BaseEntity
{
    public int MemberId { get; set; }
    public Member? Member { get; set; }

    /// <summary>The individual/home <see cref="Training"/> the player did (nullable — kept if the training is later deleted).</summary>
    public int? TrainingId { get; set; }
    public Training? Training { get; set; }

    /// <summary>Denormalized training name — survives training deletion and is what confirmers/calendar show.</summary>
    public string Title { get; set; } = string.Empty;

    public int? DurationMin { get; set; }
    public string? Note { get; set; }

    /// <summary>The day the player did the training (drives the 1/day rate limit and the calendar event time).</summary>
    public DateTime LoggedAt { get; set; }

    // Counter-sign (the other party): guardian of the child or a coach. Exactly one of Confirmed/Rejected set.
    public string? ConfirmedByUserId { get; set; }
    public DateTime? ConfirmedAt { get; set; }
    public DateTime? RejectedAt { get; set; }

    /// <summary>The personal calendar event created for this log (so it is visible as an event).</summary>
    public int? AppointmentId { get; set; }
    public Appointment? Appointment { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Only a confirmed, non-rejected log earns XP.</summary>
    public bool IsConfirmed => ConfirmedAt != null && RejectedAt == null;
}
