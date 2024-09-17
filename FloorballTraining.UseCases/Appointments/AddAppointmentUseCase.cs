using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.Appointments.Interfaces;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;

namespace FloorballTraining.UseCases.Appointments
{
    public class AddAppointmentUseCase(IAppointmentRepository appointmentRepository, IAppointmentFactory appointmentFactory) : IAddAppointmentUseCase
    {
        public async Task ExecuteAsync(AppointmentDto appointmentDto)
        {
            var appointment = await appointmentFactory.GetMergedOrBuild(appointmentDto);

            await appointmentRepository.AddAppointmentAsync(appointment).ConfigureAwait(true);
        }


    }
}
