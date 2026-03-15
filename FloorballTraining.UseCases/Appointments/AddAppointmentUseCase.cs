using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.Services;
using FloorballTraining.UseCases.Appointments.Interfaces;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;

namespace FloorballTraining.UseCases.Appointments
{
    public class AddAppointmentUseCase(
        IAppointmentRepository appointmentRepository,
        IAppointmentFactory appointmentFactory,
        IAppointmentService appointmentService) : IAddAppointmentUseCase
    {
        public async Task ExecuteAsync(AppointmentDto appointmentDto)
        {
            // Generate future appointment occurrences from repeating pattern
            if (appointmentDto.RepeatingPattern != null)
            {
                appointmentService.GenerateFutureAppointments(appointmentDto.RepeatingPattern, appointmentDto);
            }

            var appointment = await appointmentFactory.GetMergedOrBuild(appointmentDto);

            await appointmentRepository.AddAppointmentAsync(appointment).ConfigureAwait(true);
        }
    }
}
