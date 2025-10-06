using AutoMapper;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.Clubs.Interfaces;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Clubs;

public class ViewClubByIdUseCase(IClubRepository clubRepository, IMapper mapper) : IViewClubByIdUseCase
{
    public async Task<ClubDto?> ExecuteAsync(int clubId)
    {
        var club = await clubRepository.GetClubByIdAsync(clubId);
        return mapper.Map<Club?, ClubDto?>(club);
    }
}