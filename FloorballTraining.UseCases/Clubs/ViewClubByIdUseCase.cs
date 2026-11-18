using FloorballTraining.UseCases.Helpers;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.Clubs.Interfaces;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Clubs;

public class ViewClubByIdUseCase(IClubRepository clubRepository, AppMapper mapper) : IViewClubByIdUseCase
{
    public async Task<ClubDto?> ExecuteAsync(int clubId)
    {
        var club = await clubRepository.GetClubByIdAsync(clubId);
        return mapper.ToClubDto(club);
    }
}