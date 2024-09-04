using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.Appointments.Interfaces;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Appointments
{
    public class DeleteAppointmentUseCase(IAppointmentRepository appointmentRepository) : IDeleteAppointmentUseCase
    {
        public async Task ExecuteAsync(AppointmentDto appointment)
        {
            await appointmentRepository.DeleteAppointmentAsync(appointment);
        }
    }
}
