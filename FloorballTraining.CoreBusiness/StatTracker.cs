namespace FloorballTraining.CoreBusiness;

public class StatTracker : BaseEntity
{
    /// <summary>0 = Match (tournament match or match appointment), 1 = Training</summary>
    public int EventCategory { get; set; }

    public int? TournamentMatchId { get; set; }
    public TournamentMatch? TournamentMatch { get; set; }

    public int? AppointmentId { get; set; }
    public Appointment? Appointment { get; set; }

    public int TeamId { get; set; }
    public Team? Team { get; set; }

    public int? SeasonId { get; set; }
    public Season? Season { get; set; }

    /// <summary>The lineup that defines participants and formations for stats. User-chosen.</summary>
    public int? MatchLineupId { get; set; }
    public MatchLineup? MatchLineup { get; set; }

    public string? CreatedByUserId { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Match-only state (used when EventCategory == 0)
    public string? OpponentName { get; set; }
    /// <summary>Number of parts: 1 (continuous), 2 (poločasy), 3 (třetiny), 4 (čtvrtiny). null = not used.</summary>
    public int? MatchPeriodCount { get; set; }
    /// <summary>Equal duration of each part, in minutes.</summary>
    public int? MatchPartDurationMinutes { get; set; }
    /// <summary>Current part during live tracking (1-based). Used to tag new entries.</summary>
    public int? CurrentPeriod { get; set; }

    public List<StatTrackerParticipant> Participants { get; set; } = [];
    public List<StatTrackerMetric> Metrics { get; set; } = [];
    public List<StatTrackerEntry> Entries { get; set; } = [];
}
