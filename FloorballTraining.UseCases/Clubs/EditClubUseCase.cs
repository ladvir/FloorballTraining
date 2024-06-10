using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.Clubs.Interfaces;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;

namespace FloorballTraining.UseCases.Clubs
{
    public class EditClubUseCase(IClubRepository clubRepository, IClubFactory clubFactory) : IEditClubUseCase
    {
        public async Task ExecuteAsync(ClubDto clubDto)
        {
            var club = await clubFactory.GetMergedOrBuild(clubDto);


            await clubRepository.UpdateClubAsync(club);
        }
    }
}
