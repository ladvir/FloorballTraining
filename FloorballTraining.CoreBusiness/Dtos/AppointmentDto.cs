using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.CoreBusiness.Dtos;

public class AppointmentDto : BaseEntityDto
{
    public string? Name { get; set; }
    public DateTime Start { get; set; }
    public int Duration { get; set; } = 90;

    public AppointmentType AppointmentType { get; set; }

    public int? TeamId { get; set; }

    public int? TrainingId { get; set; }
    public string? TrainingName { get; set; }

    public DateTime End => Start.AddMinutes(Duration);



}