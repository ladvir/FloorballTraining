using FloorballTraining.UseCases.Clubs.Interfaces;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Clubs
{
    public class DeleteClubUseCase(IClubRepository clubRepository) : IDeleteClubUseCase
    {
        public async Task ExecuteAsync(int clubId)
        {
            await clubRepository.DeleteClubAsync(clubId);
        }
    }
}
