namespace FloorballTraining.CoreBusiness;

public class StatTrackerEntry : BaseEntity
{
    public int StatTrackerId { get; set; }
    public StatTracker? StatTracker { get; set; }

    /// <summary>0 = stat (default), 1 = score for home team, 2 = score for opponent</summary>
    public int Kind { get; set; }

    /// <summary>Required when Kind = 0 (stat); null for score events.</summary>
    public int? StatTrackerParticipantId { get; set; }
    public StatTrackerParticipant? Participant { get; set; }

    /// <summary>Required when Kind = 0 (stat); null for score events.</summary>
    public int? StatTrackerMetricId { get; set; }
    public StatTrackerMetric? Metric { get; set; }

    /// <summary>+1 or -1 (undo log style; aggregate = SUM(Delta))</summary>
    public int Delta { get; set; } = 1;

    /// <summary>Match part the entry belongs to (1-based). null = no period tracking.</summary>
    public int? Period { get; set; }

    public DateTime CreatedAt { get; set; }
}
