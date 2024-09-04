using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.Appointments.Interfaces;

public interface IViewAppointmentByIdUseCase
{
    Task<AppointmentDto?> ExecuteAsync(int appointmentId);
}