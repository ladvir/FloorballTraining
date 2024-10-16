using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.CoreBusiness.Dtos
{
    public class AppointmentsExportDto
    {
        public string? TeamName { get; set; }
        public string? CoachName { get; set; }
        public List<AppointmentDto>? Appointments { get; set; }
        public DateTime? From => Appointments?.Min(a => a.Start);
        public DateTime? To => Appointments?.Max(a => a.End);
        public double Preparation { get; set; }
        public IEnumerable<AppointmentDto>? OtherThenTrainingAppointments => Appointments?.Where(a => a.AppointmentType != AppointmentType.Training);
        public long OtherThenTrainingAppointmentsCount => OtherThenTrainingAppointments?.Count() ?? 0;
        public long PromotionCount { get; set; }

    }
}
