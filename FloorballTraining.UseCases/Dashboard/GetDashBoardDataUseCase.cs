using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.Dashboard.Interfaces;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Dashboard
{
    public class GetDashBoardDataUseCase(IActivityRepository activityRepository, ITrainingRepository trainingRepository, IClubRepository clubRepository, ITeamRepository teamRepository) : IGetDashBoardDataUseCase
    {
        public async Task<DashBoardDataDto> ExecuteAsync()
        {

            return new DashBoardDataDto
            {
                ActivitiesCount = await activityRepository.CountAllAsync(),
                TrainingsCount = await trainingRepository.CountAllAsync(),
                ClubsCount = await clubRepository.CountAllAsync(),
                TeamsCount = await teamRepository.CountAllAsync()
            };
        }
    }
}
