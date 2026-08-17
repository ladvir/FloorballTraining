using System.ComponentModel.DataAnnotations.Schema;
using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.CoreBusiness.Dtos;

[NotMapped]
public class AppointmentRatingDto
{
    public int Id { get; set; }
    public int AppointmentId { get; set; }
    public string? AppointmentName { get; set; }
    public DateTime? AppointmentStart { get; set; }
    public int? AppointmentType { get; set; }
    public int? TeamId { get; set; }
    public string? TeamName { get; set; }
    public string? TrainingName { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string? UserName { get; set; }
    public int Grade { get; set; }
    public string? Comment { get; set; }
    public RaterType RaterType { get; set; }
    public DateTime CreatedAt { get; set; }
}
