using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.Appointments.Interfaces;
using FloorballTraining.UseCases.Dashboard.Interfaces;

namespace FloorballTraining.UseCases.Dashboard
{
    public class GetDashBoardDataUseCase(IViewAppointmentsUseCase viewAppointmentsUseCase) : IGetDashBoardDataUseCase
    {
        public async Task<DashBoardDataDto> ExecuteAsync()
        {
            var readOnlyList = (await viewAppointmentsUseCase.ExecuteAsync(new AppointmentSpecificationParameters
            {
                FutureOnly = true
            })).Data;


            if (readOnlyList != null)
                return new DashBoardDataDto
                {
                    Appointments = readOnlyList.ToList()
                };

            return new DashBoardDataDto();
        }
    }
}
