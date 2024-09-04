using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.Appointments.Interfaces;

public interface IDeleteAppointmentUseCase
{
    Task ExecuteAsync(AppointmentDto appointment);
}