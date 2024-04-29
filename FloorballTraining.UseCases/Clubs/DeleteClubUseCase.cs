using FloorballTraining.UseCases.Clubs.Interfaces;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Clubs
{
    public class DeleteClubUseCase : IDeleteClubUseCase
    {
        private readonly IClubRepository _clubRepository;

        public DeleteClubUseCase(IClubRepository clubRepository)
        {
            _clubRepository = clubRepository;
        }

        public async Task ExecuteAsync(int clubId)
        {
            await _clubRepository.DeleteClubAsync(clubId);
        }
    }
}
