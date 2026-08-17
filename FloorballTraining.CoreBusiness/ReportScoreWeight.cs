namespace FloorballTraining.CoreBusiness;

/// <summary>
/// Weights of the player-report quality score components, configurable per age group
/// (Feat15 #48). Missing rows fall back to the code defaults (0.4/0.2/0.2/0.2);
/// weights of the components that have data are re-normalized at computation time.
/// </summary>
public class ReportScoreWeight : BaseEntity, IAuditable
{
    public const double DefaultTests = 0.4;
    public const double DefaultAttendance = 0.2;
    public const double DefaultWorkouts = 0.2;
    public const double DefaultGameStats = 0.2;

    public int AgeGroupId { get; set; }
    public AgeGroup? AgeGroup { get; set; }

    public double WeightTests { get; set; } = DefaultTests;
    public double WeightAttendance { get; set; } = DefaultAttendance;
    public double WeightWorkouts { get; set; } = DefaultWorkouts;
    public double WeightGameStats { get; set; } = DefaultGameStats;

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? CreatedByUserId { get; set; }
    public string? UpdatedByUserId { get; set; }
}
