namespace FloorballTraining.CoreBusiness.Dtos;

/// <summary>Complete player report (Feat15 #48) — GET /members/{id}/report.</summary>
public class PlayerReportDto
{
    public PlayerReportMemberDto Member { get; set; } = new();
    /// <summary>Per test definition, results of the last 12 months (chronological).</summary>
    public List<PlayerReportTestDto> Tests { get; set; } = [];
    public PlayerReportScoringDto Scoring { get; set; } = new();
    public PlayerReportAttendanceDto Attendance { get; set; } = new();
    public PlayerReportWorkoutsDto Workouts { get; set; } = new();
    public List<PlayerReportHighlightDto> Strengths { get; set; } = [];
    public List<PlayerReportHighlightDto> Weaknesses { get; set; } = [];
    /// <summary>0–100 weighted composite; null when no component has data.</summary>
    public double? QualityScore { get; set; }
    public PlayerReportScoreBreakdownDto ScoreBreakdown { get; set; } = new();
    public DateTime GeneratedAt { get; set; }
}

public class PlayerReportMemberDto
{
    public int Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public int BirthYear { get; set; }
    public int Age { get; set; }
    /// <summary>Enums.Gender as number; null = unknown.</summary>
    public int? Gender { get; set; }
    public string? Email { get; set; }
    public string ClubName { get; set; } = string.Empty;
    public List<string> Teams { get; set; } = [];
    /// <summary>Most frequent lineup slot (SlotPosition name); null when never in a lineup.</summary>
    public string? Position { get; set; }
    /// <summary>Member record creation — proxy for "joined the club".</summary>
    public DateTime? MemberSince { get; set; }
}

public class PlayerReportTestDto
{
    public int TestDefinitionId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Unit { get; set; }
    public bool HigherIsBetter { get; set; }
    /// <summary>Enums.TestCategory as number.</summary>
    public int Category { get; set; }
    public List<PlayerReportTestResultDto> Results { get; set; } = [];
    public double? LatestValue { get; set; }
    public string? LatestGradeLabel { get; set; }
    /// <summary>"green" | "yellow" | "red" | null (no benchmark).</summary>
    public string? LatestColour { get; set; }
    /// <summary>Performance direction: 1 improving, 0 stable, -1 declining; null with &lt; 2 results.</summary>
    public int? Trend { get; set; }
    /// <summary>Green range of the matched benchmark, e.g. "12.5–13.4 s".</summary>
    public string? BenchmarkText { get; set; }
}

public class PlayerReportTestResultDto
{
    public DateTime TestDate { get; set; }
    public double? NumericValue { get; set; }
    public string? GradeLabel { get; set; }
    public string? Colour { get; set; }
}

/// <summary>Canadian scoring over the last 12 months (match stat trackers).</summary>
public class PlayerReportScoringDto
{
    public int Goals { get; set; }
    public int Assists { get; set; }
    public int Points { get; set; }
    public int Games { get; set; }
}

public class PlayerReportAttendanceDto
{
    public int Present { get; set; }
    public int Total { get; set; }
    public double? Pct { get; set; }
}

public class PlayerReportWorkoutsDto
{
    public int Assigned { get; set; }
    public int Completed { get; set; }
    public int Skipped { get; set; }
    public double? Pct { get; set; }
}

/// <summary>Auto-detected strength or weakness with benchmark context.</summary>
public class PlayerReportHighlightDto
{
    public int TestDefinitionId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Colour { get; set; }
    public int? Trend { get; set; }
    public double? LatestValue { get; set; }
    public string? Unit { get; set; }
    public string? BenchmarkText { get; set; }
}

public class PlayerReportScoreBreakdownDto
{
    public double? TestsScore { get; set; }
    public double? AttendanceScore { get; set; }
    public double? WorkoutsScore { get; set; }
    public double? GameStatsScore { get; set; }
    public double WeightTests { get; set; }
    public double WeightAttendance { get; set; }
    public double WeightWorkouts { get; set; }
    public double WeightGameStats { get; set; }
}

// ── Score weights administration (GET/PUT /reportweights) ───────────────────

public class ReportScoreWeightDto
{
    public int AgeGroupId { get; set; }
    public string AgeGroupName { get; set; } = string.Empty;
    public double WeightTests { get; set; }
    public double WeightAttendance { get; set; }
    public double WeightWorkouts { get; set; }
    public double WeightGameStats { get; set; }
    /// <summary>False when the age group has no stored row (code defaults apply).</summary>
    public bool IsCustomized { get; set; }
}

public class UpdateReportScoreWeightRequest
{
    public int AgeGroupId { get; set; }
    public double WeightTests { get; set; }
    public double WeightAttendance { get; set; }
    public double WeightWorkouts { get; set; }
    public double WeightGameStats { get; set; }
}
