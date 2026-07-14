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
