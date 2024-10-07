using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.Appointments;

public interface IEditAppointmentUseCase
{
    Task ExecuteAsync(AppointmentDto appointmentDto, bool updateWholeChain);
}