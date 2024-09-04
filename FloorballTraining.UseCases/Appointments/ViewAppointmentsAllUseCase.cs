using AutoMapper;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.Appointments.Interfaces;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Appointments;

public class ViewAppointmentsAllUseCase(
    IAppointmentRepository appointmentRepository,
    IMapper mapper) : IViewAppointmentsAllUseCase
{
    public async Task<IReadOnlyList<AppointmentDto>> ExecuteAsync()
    {
        var appointments = await appointmentRepository.GetAllAsync();

        return mapper.Map<IReadOnlyList<Appointment>, IReadOnlyList<AppointmentDto>>(appointments);
    }
}