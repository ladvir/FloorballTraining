using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.Appointments.Interfaces;

public interface IAddAppointmentUseCase
{
    Task ExecuteAsync(AppointmentDto appointmentDto);
}