using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.Helpers;

namespace FloorballTraining.UseCases.Appointments.Interfaces;

public interface IViewAppointmentsUseCase
{
    Task<Pagination<AppointmentDto>> ExecuteAsync(AppointmentSpecificationParameters parameters);
}