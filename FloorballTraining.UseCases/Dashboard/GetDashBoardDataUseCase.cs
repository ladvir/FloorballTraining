using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.Appointments.Interfaces;
using FloorballTraining.UseCases.Dashboard.Interfaces;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Dashboard
{
    public class GetDashBoardDataUseCase(
        IViewAppointmentsUseCase viewAppointmentsUseCase,
        ITrainingRepository trainingRepository)
        : IGetDashBoardDataUseCase
    {
        public async Task<DashBoardDataDto> ExecuteAsync()
        {
            var readOnlyList = (await viewAppointmentsUseCase.ExecuteAsync(new AppointmentSpecificationParameters
            {
                FutureOnly = true
            })).Data;

            var (total, draftCount, completeCount) = await trainingRepository.GetTrainingCountsAsync();

            return new DashBoardDataDto
            {
                Appointments = readOnlyList?.ToList() ?? [],
                TotalTrainings = total,
                DraftTrainings = draftCount,
                CompleteTrainings = completeCount,
            };
        }
    }
}
