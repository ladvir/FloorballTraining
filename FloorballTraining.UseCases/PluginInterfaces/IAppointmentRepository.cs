using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.PluginInterfaces;

public interface IAppointmentRepository : IGenericRepository<Appointment>
{
    Task<Appointment?> GetAppointmentByIdAsync(int appointmentId);
    Task AddAppointmentAsync(Appointment appointment);
    Task DeleteAppointmentAsync(AppointmentDto appointment);
    Task UpdateAppointmentAsync(Appointment appointment);
}