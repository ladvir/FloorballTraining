namespace FloorballTraining.CoreBusiness.Dtos;

public class DashBoardDataDto
{
    public List<AppointmentDto> Appointments { get; set; } = [];
    public int TotalTrainings { get; set; }
    public int DraftTrainings { get; set; }
    public int CompleteTrainings { get; set; }
}