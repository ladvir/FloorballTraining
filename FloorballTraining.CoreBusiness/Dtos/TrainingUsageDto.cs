namespace FloorballTraining.CoreBusiness.Dtos;

public class TrainingUsageDto
{
    public int PastAppointments { get; set; }
    public int FutureAppointments { get; set; }
}

public class ActivityUsageDto
{
    public int TrainingCount { get; set; }
    public List<ActivityUsageTrainingDto> Trainings { get; set; } = [];
}

public class ActivityUsageTrainingDto
{
    public int TrainingId { get; set; }
    public string TrainingName { get; set; } = string.Empty;
}
