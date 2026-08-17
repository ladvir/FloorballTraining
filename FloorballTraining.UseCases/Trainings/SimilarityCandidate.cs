namespace FloorballTraining.UseCases.Trainings;

public class SimilarityCandidate
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Duration { get; set; }
    public bool IsDraft { get; set; }
    public string? CreatedByUserId { get; set; }
    public string? ActivitySignature { get; set; }
    public Dictionary<int, int> ActivityDurations { get; set; } = new();
    public int AppointmentCount { get; set; }
}
