namespace FloorballTraining.CoreBusiness.Dtos;

public enum SimilarityTier { A, B }

public class SimilarTrainingDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsDraft { get; set; }
    public int Duration { get; set; }
    public string? CreatedByUserId { get; set; }
    public string? CreatedByUserName { get; set; }
    public string Tier { get; set; } = "A";
    public double Score { get; set; }
    public bool MatchedByAuthor { get; set; }
    public bool MatchedByClub { get; set; }
    public int AppointmentCount { get; set; }
}

public class DuplicateGroupDto
{
    public string GroupKey { get; set; } = string.Empty;
    public string Tier { get; set; } = "A";
    public double MinScore { get; set; }
    public List<SimilarTrainingDto> Trainings { get; set; } = new();
}
