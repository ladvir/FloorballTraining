using AutoMapper;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.Appointments.Interfaces;
using FloorballTraining.UseCases.Helpers;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Appointments;

public class ViewAppointmentsUseCase(
    IAppointmentRepository appointmentRepository,
    IMapper mapper) : IViewAppointmentsUseCase
{
    public async Task<Pagination<AppointmentDto>> ExecuteAsync(AppointmentSpecificationParameters parameters)
    {
        var specification = new AppointmentsSpecification(parameters);

        var countSpecification = new AppointmentsWithFilterForCountSpecification(parameters);

        var totalItems = await appointmentRepository.CountAsync(countSpecification);

        var appointments = await appointmentRepository.GetListAsync(specification);

        var data = mapper.Map<IReadOnlyList<Appointment>, IReadOnlyList<AppointmentDto>>(appointments);

        return new Pagination<AppointmentDto>(parameters.PageIndex, parameters.PageSize, totalItems, data);
    }
}