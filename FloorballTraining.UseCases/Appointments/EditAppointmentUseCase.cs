﻿using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;

namespace FloorballTraining.UseCases.Appointments
{
    public class EditAppointmentUseCase(IAppointmentRepository appointmentRepository, IAppointmentFactory appointmentFactory) : IEditAppointmentUseCase
    {
        public async Task ExecuteAsync(AppointmentDto appointmentDto, bool updateWholeChain)
        {
            var appointment = await appointmentFactory.GetMergedOrBuild(appointmentDto);

            await appointmentRepository.UpdateAppointmentAsync(appointment, updateWholeChain).ConfigureAwait(false);
        }
    }
}
