using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.CoreBusiness.Dtos;

/// <summary>Full nested season plan of one team.</summary>
public class SeasonPlanDto
{
    public int TeamId { get; set; }
    public string TeamName { get; set; } = string.Empty;
    public int? SeasonId { get; set; }
    public string? SeasonName { get; set; }
    public DateTime? SeasonStart { get; set; }
    public DateTime? SeasonEnd { get; set; }
    public List<MesocycleDto> Mesocycles { get; set; } = [];
}

public class MesocycleDto
{
    public int Id { get; set; }
    public int TeamId { get; set; }
    public string Name { get; set; } = string.Empty;
    public MesocyclePhase Phase { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string? Goal { get; set; }
    /// <summary>Write side: tag ids to set (max 3, IsTrainingGoal tags).</summary>
    public List<int> GoalTagIds { get; set; } = [];
    /// <summary>Read side: resolved tags with name + color.</summary>
    public List<TagDto> GoalTags { get; set; } = [];
    public List<MicrocycleDto> Microcycles { get; set; } = [];
}

public class MicrocycleDto
{
    public int Id { get; set; }
    public int MesocycleId { get; set; }
    public string Name { get; set; } = string.Empty;
    public MicrocycleType Type { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string? Goal { get; set; }
    public List<int> GoalTagIds { get; set; } = [];
    public List<TagDto> GoalTags { get; set; } = [];
    public List<MicrocycleTrainingDto> RecommendedTrainings { get; set; } = [];
}

public class MicrocycleTrainingDto
{
    public int Id { get; set; }
    public int TrainingId { get; set; }
    public string TrainingName { get; set; } = string.Empty;
    public int Duration { get; set; }
    public string? Note { get; set; }
    public int SortOrder { get; set; }
    /// <summary>How many appointments with this training + team fall inside the microcycle range.</summary>
    public int ScheduledCount { get; set; }
}

/// <summary>Flat cycle row for tinting the calendar month grid.</summary>
public class CycleCalendarDto
{
    public int MicrocycleId { get; set; }
    public int MesocycleId { get; set; }
    public string MesocycleName { get; set; } = string.Empty;
    public MesocyclePhase Phase { get; set; }
    public string MicrocycleName { get; set; } = string.Empty;
    public MicrocycleType Type { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
}

/// <summary>Request for splitting a mesocycle into Monday-aligned week microcycles.</summary>
public class GenerateWeeksRequestDto
{
    public MicrocycleType Type { get; set; }
    /// <summary>Localized week name prefix sent by the client (e.g. "Týden").</summary>
    public string NamePrefix { get; set; } = "Week";
    /// <summary>When false and microcycles already exist, the request is rejected with 409.</summary>
    public bool Overwrite { get; set; }
}

/// <summary>Replace-set payload for a microcycle's recommended trainings.</summary>
public class MicrocycleTrainingsUpdateDto
{
    public List<MicrocycleTrainingItemDto> Items { get; set; } = [];
}

public class MicrocycleTrainingItemDto
{
    public int TrainingId { get; set; }
    public string? Note { get; set; }
    public int SortOrder { get; set; }
}

// ── Evaluation ────────────────────────────────────────────────────────────────

/// <summary>Evaluation summary of one mesocycle: totals + per-microcycle blocks + test progression.</summary>
public class MesocycleEvaluationDto
{
    public CycleEvaluationBlockDto Total { get; set; } = new();
    public List<CycleEvaluationBlockDto> Microcycles { get; set; } = [];
    public List<TestProgressionDto> TestProgression { get; set; } = [];
    public List<AppointmentRefDto> TestingAppointments { get; set; } = [];
}

/// <summary>Aggregates over the appointments of one cycle date range (held events only for coverage).</summary>
public class CycleEvaluationBlockDto
{
    public int CycleId { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime From { get; set; }
    public DateTime To { get; set; }

    // Goal coverage — held Training-type appointments
    public int TrainingAppointmentsCount { get; set; }
    public int WithLinkedTrainingCount { get; set; }
    /// <summary>Σ activity minutes (training parts) of held linked trainings.</summary>
    public int TotalTrainingMinutes { get; set; }
    /// <summary>Σ minutes of training parts targeting the cycle's goal tags.</summary>
    public int GoalMatchedMinutes { get; set; }
    public double GoalCoveragePercent { get; set; }
    public List<TagCoverageDto> PerTag { get; set; } = [];

    // Attendance — over all appointments of the team in range
    public int PresentCount { get; set; }
    public int AbsentCount { get; set; }
    public int ExcusedCount { get; set; }
    public int UnknownCount { get; set; }
    public double AttendanceRatePercent { get; set; }

    // Ratings (grades 1 = best … 5 = worst)
    public double? AverageGrade { get; set; }
    public int RatingsCount { get; set; }
    public double? CoachAverageGrade { get; set; }
    public double? PlayerAverageGrade { get; set; }
}

public class TagCoverageDto
{
    public int TagId { get; set; }
    public string TagName { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public int MatchedMinutes { get; set; }
    public int TrainingsCount { get; set; }
}

/// <summary>Average test values in the windows around the mesocycle start and end.</summary>
public class TestProgressionDto
{
    public int TestDefinitionId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Unit { get; set; }
    public bool HigherIsBetter { get; set; }
    public double? StartAvg { get; set; }
    public double? EndAvg { get; set; }
    public double? Delta { get; set; }
    public int ImprovedCount { get; set; }
    public int WorsenedCount { get; set; }
    public int MembersMeasuredBoth { get; set; }
}

public class AppointmentRefDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime Start { get; set; }
}
