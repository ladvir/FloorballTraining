using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;

namespace FloorballTraining.UseCases.Appointments
{
    public class EditAppointmentUseCase(IAppointmentRepository appointmentRepository, IAppointmentFactory appointmentFactory) : IEditAppointmentUseCase
    {
        public async Task ExecuteAsync(AppointmentDto appointmentDto)
        {
            var appointment = await appointmentFactory.GetMergedOrBuild(appointmentDto);

            await appointmentRepository.UpdateAppointmentAsync(appointment).ConfigureAwait(false);


            if (appointmentDto.RepeatingPattern != null && appointmentDto.RepeatingPattern.FutureAppointments.Any())
            {
                foreach (var futureAppointmentDto in appointmentDto.RepeatingPattern.FutureAppointments)
                {
                    var futureAppointment = await appointmentFactory.GetMergedOrBuild(futureAppointmentDto);
                    await appointmentRepository.UpdateAppointmentAsync(futureAppointment).ConfigureAwait(false);
                }
            }
        }
    }
}
