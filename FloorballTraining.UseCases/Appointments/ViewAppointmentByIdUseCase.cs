using AutoMapper;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.Appointments.Interfaces;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Appointments;

public class ViewAppointmentByIdUseCase(IAppointmentRepository appointmentRepository, IMapper mapper) : IViewAppointmentByIdUseCase
{
    public async Task<AppointmentDto?> ExecuteAsync(int appointmentId)
    {
        var appointment = await appointmentRepository.GetByIdAsync(appointmentId);

        return appointment == null ? null : mapper.Map<Appointment, AppointmentDto>(appointment);
    }
}