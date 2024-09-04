using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.Appointments.Interfaces;

public interface IViewAppointmentsAllUseCase
{
    Task<IReadOnlyList<AppointmentDto>> ExecuteAsync();
}