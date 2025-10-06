using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.PluginInterfaces;

public interface IAppointmentRepository : IGenericRepository<Appointment>
{
    Task<Appointment?> GetAppointmentByIdAsync(int appointmentId);
    Task AddAppointmentAsync(Appointment appointment);
    Task DeleteAppointmentAsync(int appointmentId, bool alsoFutureAppointmentsToBeDeleted = false);
    Task UpdateAppointmentAsync(Appointment appointment, bool updateWholeChain);
}